import os
import json
import uuid
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger("database")

class DatabaseResult:
    def __init__(self, inserted_id: Any = None, modified_count: int = 1, deleted_count: int = 1):
        self.inserted_id = inserted_id
        self.modified_count = modified_count
        self.deleted_count = deleted_count

class FallbackCollection:
    def __init__(self, db_wrapper: "ResilientDatabase", name: str):
        self.db_wrapper = db_wrapper
        self.name = name

    async def find_one(self, filter_query: Dict[str, Any], sort: Optional[List[tuple]] = None) -> Optional[Dict[str, Any]]:
        if not self.db_wrapper.use_local:
            try:
                coll = self.db_wrapper.mongo_db[self.name]
                if sort:
                    return await coll.find_one(filter_query, sort=sort)
                return await coll.find_one(filter_query)
            except Exception as e:
                logger.warning(f"MongoDB find_one error for '{self.name}': {e}. Switching to local storage.")
                self.db_wrapper.use_local = True

        return self.db_wrapper.local_find_one(self.name, filter_query, sort)

    async def find(self, filter_query: Optional[Dict[str, Any]] = None, sort: Optional[List[tuple]] = None, limit: int = 0, skip: int = 0) -> List[Dict[str, Any]]:
        filter_query = filter_query or {}
        if not self.db_wrapper.use_local:
            try:
                coll = self.db_wrapper.mongo_db[self.name]
                cursor = coll.find(filter_query)
                if sort:
                    cursor = cursor.sort(sort)
                if skip > 0:
                    cursor = cursor.skip(skip)
                if limit > 0:
                    cursor = cursor.limit(limit)
                results = await cursor.to_list(length=limit if limit > 0 else 1000)
                return results
            except Exception as e:
                logger.warning(f"MongoDB find error for '{self.name}': {e}. Switching to local storage.")
                self.db_wrapper.use_local = True

        return self.db_wrapper.local_find(self.name, filter_query, sort, limit, skip)

    async def insert_one(self, document: Dict[str, Any]) -> DatabaseResult:
        if not self.db_wrapper.use_local:
            try:
                coll = self.db_wrapper.mongo_db[self.name]
                res = await coll.insert_one(document)
                return DatabaseResult(inserted_id=str(res.inserted_id))
            except Exception as e:
                logger.warning(f"MongoDB insert_one error for '{self.name}': {e}. Switching to local storage.")
                self.db_wrapper.use_local = True

        return self.db_wrapper.local_insert_one(self.name, document)

    async def update_one(self, filter_query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False) -> DatabaseResult:
        if not self.db_wrapper.use_local:
            try:
                coll = self.db_wrapper.mongo_db[self.name]
                res = await coll.update_one(filter_query, update, upsert=upsert)
                return DatabaseResult(modified_count=res.modified_count, inserted_id=str(res.upserted_id) if res.upserted_id else None)
            except Exception as e:
                logger.warning(f"MongoDB update_one error for '{self.name}': {e}. Switching to local storage.")
                self.db_wrapper.use_local = True

        return self.db_wrapper.local_update_one(self.name, filter_query, update, upsert)

    async def delete_one(self, filter_query: Dict[str, Any]) -> DatabaseResult:
        if not self.db_wrapper.use_local:
            try:
                coll = self.db_wrapper.mongo_db[self.name]
                res = await coll.delete_one(filter_query)
                return DatabaseResult(deleted_count=res.deleted_count)
            except Exception as e:
                logger.warning(f"MongoDB delete_one error for '{self.name}': {e}. Switching to local storage.")
                self.db_wrapper.use_local = True

        return self.db_wrapper.local_delete_one(self.name, filter_query)

    async def count_documents(self, filter_query: Optional[Dict[str, Any]] = None) -> int:
        filter_query = filter_query or {}
        if not self.db_wrapper.use_local:
            try:
                coll = self.db_wrapper.mongo_db[self.name]
                return await coll.count_documents(filter_query)
            except Exception as e:
                logger.warning(f"MongoDB count_documents error: {e}. Switching to local.")
                self.db_wrapper.use_local = True

        return len(self.db_wrapper.local_find(self.name, filter_query))

class ResilientDatabase:
    def __init__(self, mongo_uri: str, db_name: str = "ai_career_db"):
        self.mongo_uri = mongo_uri
        self.db_name = db_name
        self.use_local = False
        self.local_db_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "data", "local_db.json")
        )
        os.makedirs(os.path.dirname(self.local_db_path), exist_ok=True)
        self.local_data: Dict[str, List[Dict[str, Any]]] = {}
        self._load_local_db()

        # Initialize client non-blockingly
        if os.environ.get("USE_LOCAL_DB", "").lower() in ("true", "1") or not self.mongo_uri:
            logger.info("USE_LOCAL_DB set or empty URI. Operating in local storage mode.")
            self.use_local = True
            self.client = None
            self.mongo_db = None
        else:
            try:
                self.client = AsyncIOMotorClient(
                    self.mongo_uri,
                    serverSelectionTimeoutMS=2000,
                    connectTimeoutMS=2000,
                    socketTimeoutMS=2000
                )
                self.mongo_db = self.client[self.db_name]
                logger.info(f"Initialized AsyncIOMotorClient for database: {self.db_name}")
            except Exception as e:
                logger.warning(f"MongoDB client init fallback ({e}). Operating in resilient local storage mode.")
                self.use_local = True
                self.client = None
                self.mongo_db = None

        # Collections
        self.users = FallbackCollection(self, "users")
        self.profiles = FallbackCollection(self, "profiles")
        self.chats = FallbackCollection(self, "chats")
        self.jobs = FallbackCollection(self, "jobs")
        self.batches = FallbackCollection(self, "batches")
        self.candidates = FallbackCollection(self, "candidates")
        self.shortlists = FallbackCollection(self, "shortlists")
        self.audit_logs = FallbackCollection(self, "audit_logs")
        self.resumes = FallbackCollection(self, "resumes")

    def _load_local_db(self):
        default_keys = ["users", "profiles", "chats", "jobs", "batches", "candidates", "shortlists", "audit_logs", "resumes"]
        if os.path.exists(self.local_db_path):
            try:
                with open(self.local_db_path, "r", encoding="utf-8") as f:
                    self.local_data = json.load(f)
                    for k in default_keys:
                        if k not in self.local_data:
                            self.local_data[k] = []
            except Exception as e:
                logger.error(f"Error loading local_db.json: {e}. Reinitializing.")
                self.local_data = {k: [] for k in default_keys}
        else:
            self.local_data = {k: [] for k in default_keys}
            self._save_local_db()

    def _save_local_db(self):
        try:
            with open(self.local_db_path, "w", encoding="utf-8") as f:
                json.dump(self.local_data, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Failed to write local_db.json: {e}")

    def _matches_filter(self, item: Dict[str, Any], filter_query: Dict[str, Any]) -> bool:
        for k, v in filter_query.items():
            if k == "$or" and isinstance(v, list):
                if not any(self._matches_filter(item, cond) for cond in v):
                    return False
            elif k == "$in" and isinstance(v, list):
                return False
            elif isinstance(v, dict):
                # Simple operator support
                val = item.get(k)
                if "$in" in v and val not in v["$in"]:
                    return False
                if "$gte" in v and (val is None or val < v["$gte"]):
                    return False
                if "$lte" in v and (val is None or val > v["$lte"]):
                    return False
                if "$ne" in v and val == v["$ne"]:
                    return False
            else:
                if item.get(k) != v:
                    return False
        return True

    def local_find_one(self, collection_name: str, filter_query: Dict[str, Any], sort: Optional[List[tuple]] = None) -> Optional[Dict[str, Any]]:
        self._load_local_db()
        items = self.local_data.get(collection_name, [])
        matches = [item for item in items if self._matches_filter(item, filter_query)]
        if not matches:
            return None
        if sort:
            for field, order in reversed(sort):
                matches.sort(key=lambda x: str(x.get(field, "")), reverse=(order == -1))
        return dict(matches[0])

    def local_find(self, collection_name: str, filter_query: Dict[str, Any], sort: Optional[List[tuple]] = None, limit: int = 0, skip: int = 0) -> List[Dict[str, Any]]:
        self._load_local_db()
        items = self.local_data.get(collection_name, [])
        matches = [dict(item) for item in items if self._matches_filter(item, filter_query)]
        if sort:
            for field, order in reversed(sort):
                matches.sort(key=lambda x: str(x.get(field, "")), reverse=(order == -1))
        if skip > 0:
            matches = matches[skip:]
        if limit > 0:
            matches = matches[:limit]
        return matches

    def local_insert_one(self, collection_name: str, document: Dict[str, Any]) -> DatabaseResult:
        self._load_local_db()
        if collection_name not in self.local_data:
            self.local_data[collection_name] = []
        if "_id" not in document:
            document["_id"] = str(uuid.uuid4())
        doc_copy = {}
        for k, v in document.items():
            if isinstance(v, datetime):
                doc_copy[k] = v.isoformat()
            else:
                doc_copy[k] = v
        self.local_data[collection_name].append(doc_copy)
        self._save_local_db()
        return DatabaseResult(inserted_id=document["_id"])

    def local_update_one(self, collection_name: str, filter_query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False) -> DatabaseResult:
        self._load_local_db()
        items = self.local_data.get(collection_name, [])
        for i, item in enumerate(items):
            if self._matches_filter(item, filter_query):
                if "$set" in update:
                    for k, v in update["$set"].items():
                        if isinstance(v, datetime):
                            items[i][k] = v.isoformat()
                        else:
                            items[i][k] = v
                else:
                    for k, v in update.items():
                        if not k.startswith("$"):
                            items[i][k] = v
                self._save_local_db()
                return DatabaseResult(modified_count=1)
        if upsert:
            new_doc = {k: v for k, v in filter_query.items()}
            if "$set" in update:
                new_doc.update(update["$set"])
            new_id = str(uuid.uuid4())
            new_doc["_id"] = new_id
            items.append(new_doc)
            self._save_local_db()
            return DatabaseResult(inserted_id=new_id, modified_count=1)
        return DatabaseResult(modified_count=0)

    def local_delete_one(self, collection_name: str, filter_query: Dict[str, Any]) -> DatabaseResult:
        self._load_local_db()
        items = self.local_data.get(collection_name, [])
        initial_len = len(items)
        self.local_data[collection_name] = [item for item in items if not self._matches_filter(item, filter_query)]
        deleted = initial_len - len(self.local_data[collection_name])
        if deleted > 0:
            self._save_local_db()
        return DatabaseResult(deleted_count=deleted)

db = ResilientDatabase(settings.MONGO_URI, settings.DATABASE_NAME)

import logging 
from typing import Any 
from sqlalchemy import text 
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.embeddings_service import encode, cosine_similarity
from app.schemas.candidate import SearchResult

logger = logging.getLogger(__name__)

async def semantic_search(
        query: str,
        db: AsyncSession,
        top_k: int = 10,
        filters: dict[str, Any] | None = None,
) -> list[SearchResult]:
    """
        1. Encode the query text into a vector
        2. Run pgvector ANN search against candidates embeddings
        3. Apply optional metadata filters (min_years, service_line, etc.)
        4. Return ranked SearchResult list
    """

    query_vec = await encode(query)
    # pgvector expects a Python list cast to a string like '[0.1, 0.2, ...]'
    vec_str = "[" + ",".join(f"{v:.6f}" for v in query_vec) + "]"

    # Build dynamic Where clauses from filters
    where_clauses = ["embedding IS NOT NULL"]
    params: dict[str, Any] = {"query_vec": vec_str, "top_k": top_k}

    if filters:
        if "min_yoe" in filters:
            where_clauses.append("years_of_experience >= :min_yoe")
            params["min_yoe"] = int(filters['min_yoe'])
        if "location" in filters:
            where_clauses.append("location ILIKE :location")
            params["location"] = f"%{filters['location']}%"
    
    where_sql = " AND ".join(where_clauses)

    sql = text(f"""
        SELECT
            id,
            name,
            email,
            summary,
            1 - (embedding <=> CAST(:query_vec AS vector)) AS similarity
        FROM candidates
        WHERE {where_sql}
        ORDER BY embedding <=> CAST(:query_vec AS vector)
        LIMIT :top_k
    """)

    try:
        result = await db.execute(sql,params)
        rows = result.fetchall()
    except Exception as e:
        logger.error("Vector search failed %s",e)
        return []
    return [
        SearchResult(
            candidate_id=row.id,
            name=row.name,
            similarity_score=round(float(row.similarity), 4),
            snippet=(row.summary or "")[:200],
        )
        for row in rows
    ]


async def skill_search(
        required_skills: list[str],
        db: AsyncSession,
        top_k: int = 20
) -> list[int]:
    """
        Returns candidate IDs that match ANY of the required skills.
        Use for hard-filter before semantic re-ranking
    """
    if not required_skills:
        return []
    
    # Normalize to lower-case for matching 
    skill_params = {f"s{i}": s.lower() for i, s in enumerate(required_skills)}
    placeholders = ", ".join(f":s{i}" for i in range(len(required_skills)))

    sql = text(f"""
        SELECT DISTINCT candidate_id, COUNT(*) AS match_count
        FROM candidate_skills
        WHERE LOWER(canonical) IN ({placeholders})
        GROUP BY candidate_id
        ORDER BY match_count DESC
        LIMIT :top_k
    """)

    params = {**skill_params, "top_k": top_k}

    result = await db.execute(sql,params)
    return [row.candidate_id for row in result.fetchall()]

async def hybrid_search(
    query: str,
    required_skills: list[str],
    db: AsyncSession,
    top_k: int = 10,
    filters: dict[str, Any] | None = None,
) -> list[SearchResult]:
    """
    Two-stage retrieval:
    Stage 1 — retrieve candidates that have ANY required skill (SQL).
    Stage 2 — re-rank by semantic similarity to the query (pgvector).

    Falls back to pure semantic search if no required_skills given.
    """
    if not required_skills:
        return await semantic_search(query, db, top_k=top_k, filters=filters)

    candidate_ids = await skill_search(required_skills, db, top_k=top_k * 3)
    if not candidate_ids:
        return await semantic_search(query, db, top_k=top_k, filters=filters)

    # Re-rank the skill-filtered pool by semantic distance
    id_list = ",".join(str(i) for i in candidate_ids)
    query_vec = await encode(query)
    vec_str = "[" + ",".join(f"{v:.6f}" for v in query_vec) + "]"

    extra_where = ""
    params: dict[str, Any] = {
        "query_vec": vec_str,
        "top_k": top_k,
    }
    if filters and "min_yoe" in filters:
        extra_where = "AND years_of_experience >= :min_yoe"
        params["min_yoe"] = int(filters["min_yoe"])

    sql = text(f"""
        SELECT
            id,
            name,
            email,
            summary,
            1 - (embedding <=> CAST(:query_vec AS vector)) AS similarity
        FROM candidates
        WHERE id IN ({id_list})
          AND embedding IS NOT NULL
          {extra_where}
        ORDER BY embedding <=> CAST(:query_vec AS vector)
        LIMIT :top_k
    """)

    result = await db.execute(sql, params)
    rows = result.fetchall()

    return [
        SearchResult(
            candidate_id=row.id,
            name=row.name,
            similarity_score=round(float(row.similarity), 4),
            snippet=(row.summary or "")[:200],
        )
        for row in rows
    ]

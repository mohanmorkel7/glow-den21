import type { Request, Response } from "express";
import { Router } from "express";
import path from "path";
import fs from "fs";
import { query } from "../db/connection";

const router = Router();

const STORAGE_ROOT = path.join(process.cwd(), "storage", "tutorials");

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// GET /api/tutorials - list all tutorials (optionally by category or search)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query as any;
    const where: string[] = [];
    const params: any[] = [];

    if (category) {
      params.push(category);
      where.push(`category = $${params.length}`);
    }
    if (search) {
      params.push(`%${String(search).toLowerCase()}%`);
      where.push(`LOWER(title) LIKE $${params.length}`);
    }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const sql = `SELECT id, title, description, category, status, instructions, target_roles, is_required, tags, "order", video_file_name, video_file_path, video_mime, created_by_user_id, created_at, updated_at FROM tutorials ${whereClause} ORDER BY created_at DESC`;
    const result = await query(sql, params);

    const data = result.rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description || "",
      category: r.category || "getting_started",
      status: r.status || "published",
      instructions: r.instructions || "",
      targetRoles: Array.isArray(r.target_roles) ? r.target_roles : ["user"],
      isRequired: !!r.is_required,
      tags: Array.isArray(r.tags) ? r.tags : [],
      order: r.order ?? 0,
      videoUrl: r.video_file_path ? `/api/tutorials/${r.id}/video` : null,
      videoFileName: r.video_file_name || null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    res.json({ data });
  } catch (error) {
    console.error("List tutorials error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to list tutorials",
      },
    });
  }
});

// POST /api/tutorials - create tutorial with metadata and optional steps
router.post("/", async (req: Request, res: Response) => {
  try {
    const currentUser: any = (req as any).user;
    const b = req.body || {};
    const id = `tut_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    const insert = `INSERT INTO tutorials (id, title, description, category, status, instructions, target_roles, is_required, tags, "order", created_by_user_id, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,COALESCE($10,0),$11,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`;

    await query(insert, [
      id,
      b.title,
      b.description || null,
      b.category || "getting_started",
      b.status || "published",
      b.instructions || null,
      Array.isArray(b.targetRoles) ? b.targetRoles : ["user"],
      !!b.isRequired,
      Array.isArray(b.tags) ? b.tags : [],
      Number.isFinite(b.order) ? Number(b.order) : 0,
      currentUser?.id || null,
    ]);

    if (Array.isArray(b.steps) && b.steps.length) {
      for (const s of b.steps) {
        const sid = `tstep_${Math.random().toString(36).slice(2, 10)}`;
        await query(
          `INSERT INTO tutorial_steps (id, tutorial_id, step_number, title, description, image_url, video_timestamp, is_required)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            sid,
            id,
            s.stepNumber || 1,
            s.title || "",
            s.description || null,
            s.imageUrl || null,
            s.videoTimestamp || null,
            !!s.isRequired,
          ],
        );
      }
    }

    res.status(201).json({ data: { id } });
  } catch (error) {
    console.error("Create tutorial error:", error);
    res.status(500).json({
      error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to create tutorial" },
    });
  }
});

// GET /api/tutorials/:id - get tutorial with steps
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tr = await query(
      `SELECT id, title, description, category, status, instructions, target_roles, is_required, tags, "order", video_file_name, video_file_path, video_mime, created_by_user_id, created_at, updated_at FROM tutorials WHERE id = $1`,
      [id],
    );
    if (!tr.rows.length) {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "Tutorial not found" } });
    }
    const r = tr.rows[0];
    const stepsRes = await query(
      `SELECT id, step_number, title, description, image_url, video_timestamp, is_required FROM tutorial_steps WHERE tutorial_id = $1 ORDER BY step_number ASC`,
      [id],
    );
    const steps = stepsRes.rows.map((s: any) => ({
      id: s.id,
      stepNumber: s.step_number,
      title: s.title,
      description: s.description || "",
      imageUrl: s.image_url || undefined,
      videoTimestamp: s.video_timestamp || undefined,
      isRequired: !!s.is_required,
    }));

    res.json({
      data: {
        id: r.id,
        title: r.title,
        description: r.description || "",
        category: r.category || "getting_started",
        status: r.status || "published",
        instructions: r.instructions || "",
        targetRoles: Array.isArray(r.target_roles) ? r.target_roles : ["user"],
        isRequired: !!r.is_required,
        tags: Array.isArray(r.tags) ? r.tags : [],
        order: r.order ?? 0,
        videoUrl: r.video_file_path ? `/api/tutorials/${r.id}/video` : null,
        videoFileName: r.video_file_name || null,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        steps,
      },
    });
  } catch (error) {
    console.error("Get tutorial error:", error);
    res.status(500).json({
      error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch tutorial" },
    });
  }
});

// PUT /api/tutorials/:id - update tutorial (metadata and optionally replace steps)
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const updatable = [
      "title",
      "description",
      "category",
      "status",
      "instructions",
      "target_roles",
      "is_required",
      "tags",
      "order",
    ];

    const mapKey = (k: string) =>
      k === "targetRoles"
        ? "target_roles"
        : k === "isRequired"
        ? "is_required"
        : k;

    for (const [k, v] of Object.entries(body)) {
      const col = mapKey(k);
      if (updatable.includes(col)) {
        fields.push(`${col} = $${idx++}`);
        values.push(col === "order" ? Number(v) : v);
      }
    }

    if (!fields.length) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "No updatable fields provided",
        },
      });
    }

    values.push(id);
    const sql = `UPDATE tutorials SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING id, title, description, category, status, instructions, target_roles, is_required, tags, "order", video_file_name, video_file_path, video_mime, created_by_user_id, created_at, updated_at`;
    const result = await query(sql, values);
    if (!result.rows.length) {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "Tutorial not found" } });
    }

    // Optionally replace steps
    if (Array.isArray(body.steps)) {
      await query(`DELETE FROM tutorial_steps WHERE tutorial_id = $1`, [id]);
      for (const s of body.steps) {
        const sid = `tstep_${Math.random().toString(36).slice(2, 10)}`;
        await query(
          `INSERT INTO tutorial_steps (id, tutorial_id, step_number, title, description, image_url, video_timestamp, is_required)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            sid,
            id,
            s.stepNumber || 1,
            s.title || "",
            s.description || null,
            s.imageUrl || null,
            s.videoTimestamp || null,
            !!s.isRequired,
          ],
        );
      }
    }

    const r = result.rows[0];
    res.json({
      data: {
        id: r.id,
        title: r.title,
        description: r.description || "",
        category: r.category || "getting_started",
        status: r.status || "published",
        instructions: r.instructions || "",
        targetRoles: Array.isArray(r.target_roles) ? r.target_roles : ["user"],
        isRequired: !!r.is_required,
        tags: Array.isArray(r.tags) ? r.tags : [],
        order: r.order ?? 0,
        videoUrl: r.video_file_path ? `/api/tutorials/${r.id}/video` : null,
        videoFileName: r.video_file_name || null,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      },
    });
  } catch (error) {
    console.error("Update tutorial error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update tutorial",
      },
    });
  }
});

// DELETE /api/tutorials/:id - delete tutorial and associated files
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Fetch to know file path
    const result = await query(
      `DELETE FROM tutorials WHERE id = $1 RETURNING video_file_path`,
      [id],
    );
    // Remove storage dir if exists
    const dir = path.join(STORAGE_ROOT, id);
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch (e) {
        console.warn("Failed to cleanup tutorial storage for", id, e);
      }
    }
    if (!result.rowCount) {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "Tutorial not found" } });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Delete tutorial error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete tutorial",
      },
    });
  }
});

// POST /api/tutorials/upload - create tutorial and upload video (raw bytes)
router.post("/upload", async (req: Request, res: Response) => {
  try {
    const currentUser: any = (req as any).user;
    const titleHeader =
      (req.headers["x-tutorial-name"] as string) || "Untitled Tutorial";
    const categoryHeader =
      (req.headers["x-tutorial-category"] as string) || "getting_started";
    const originalName = (req.headers["x-file-name"] as string) || "video.mp4";
    const mime =
      (req.headers["content-type"] as string) || "application/octet-stream";

    const safeName = originalName.replace(/[^a-zA-Z0-9_.\-]/g, "_");
    const id = `tut_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    ensureDir(STORAGE_ROOT);
    const tutDir = path.join(STORAGE_ROOT, id);
    ensureDir(tutDir);
    const destPath = path.join(tutDir, safeName);

    const ws = fs.createWriteStream(destPath);
    req.pipe(ws);

    ws.on("finish", async () => {
      await query(
        `INSERT INTO tutorials (id, title, description, category, status, video_file_name, video_file_path, video_mime, created_by_user_id, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
        [
          id,
          titleHeader,
          null,
          categoryHeader,
          "published",
          safeName,
          destPath.replace(process.cwd() + path.sep, ""),
          mime,
          currentUser?.id || null,
        ],
      );

      res.status(201).json({
        data: {
          id,
          title: titleHeader,
          description: "",
          category: categoryHeader,
          status: "published",
          videoUrl: `/api/tutorials/${id}/video`,
          videoFileName: safeName,
        },
      });
    });

    ws.on("error", (err) => {
      console.error("Tutorial upload write error:", err);
      res.status(500).json({
        error: {
          code: "WRITE_ERROR",
          message: "Failed to save uploaded video",
        },
      });
    });
  } catch (error) {
    console.error("Upload tutorial error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to upload tutorial video",
      },
    });
  }
});

// GET /api/tutorials/:id/video - stream video file
router.get("/:id/video", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT video_file_name, video_file_path, video_mime FROM tutorials WHERE id = $1`,
      [id],
    );
    if (!result.rows.length) {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "Video not found" } });
    }
    const r = result.rows[0];
    const absPath = path.isAbsolute(r.video_file_path)
      ? r.video_file_path
      : path.join(process.cwd(), r.video_file_path);

    if (!r.video_file_path || !fs.existsSync(absPath)) {
      return res
        .status(404)
        .json({
          error: { code: "FILE_NOT_FOUND", message: "Video file missing" },
        });
    }

    const stat = fs.statSync(absPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const mime = r.video_mime || "video/mp4";

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      const chunkSize = end - start + 1;
      const file = fs.createReadStream(absPath, { start, end });
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": mime,
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": mime,
      });
      fs.createReadStream(absPath).pipe(res);
    }
  } catch (error) {
    console.error("Stream tutorial video error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to stream video",
      },
    });
  }
});

export default router;

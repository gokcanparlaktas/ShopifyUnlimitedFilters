import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "data", "config.json");

function ensureDataDir() {
  const dir = path.dirname(CONFIG_PATH);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getDefaultConfig() {
  return {
    enabled: true,
    showSorting: true,
    grid: {
      mobile: 2,
      tablet: 3,
      desktop: 4,
    },
    filters: [],
  };
}

export async function GET() {
  try {
    ensureDataDir();

    if (!fs.existsSync(CONFIG_PATH)) {
      return Response.json({
        ok: true,
        config: getDefaultConfig(),
      });
    }

    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw);

    return Response.json({
      ok: true,
      config: parsed,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    ensureDataDir();

    const body = await request.json();

    const config = {
      enabled: body.enabled ?? true,
      showSorting: body.showSorting ?? true,
      grid: body.grid || {
        mobile: 2,
        tablet: 3,
        desktop: 4,
      },
      filters: Array.isArray(body.filters) ? body.filters : [],
    };

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");

    return Response.json({
      ok: true,
      config,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
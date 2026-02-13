import "dotenv/config";
import app from "./app.js";
import { prisma } from "./utils/prisma.js";

const PORT = process.env.PORT || 4000;

async function main() {
  await prisma.$connect();
  app.listen(PORT, () => {
    console.log(`Private Knowledge Q&A backend listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

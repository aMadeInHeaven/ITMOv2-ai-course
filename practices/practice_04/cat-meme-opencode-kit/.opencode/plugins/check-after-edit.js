export default function(ctx) {
  ctx.tool.hook("execute.after", async (data) => {
    if (data.tool === "write_file" || data.tool === "edit_file") {
      ctx.log("Файл изменен. Запуск check-runner...");
      try {
        const result = await ctx.exec("node scripts/check.mjs");
        ctx.log("PASS: " + result.stdout);
      } catch (err) {
        ctx.warn("FAIL: " + err.message);
      }
    }
  });
}

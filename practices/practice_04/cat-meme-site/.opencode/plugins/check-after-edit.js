export default function(ctx) {
  ctx.tool.hook("execute.after", async (data) => {
    const editTools = new Set(["write", "edit", "write_file", "edit_file"]);
    if (editTools.has(data.tool)) {
      ctx.log("Файл изменен. Запуск runner проверки...");
      try {
        const result = await ctx.exec("node scripts/check.mjs");
        ctx.log("CHECK PASS:\n" + result.stdout);
      } catch (err) {
        ctx.warn("CHECK FAIL:\n" + err.message);
      }
    }
  });
}

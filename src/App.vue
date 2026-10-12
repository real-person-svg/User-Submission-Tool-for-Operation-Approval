<template>
  <main class="mx-auto my-[12vh] max-w-[760px] p-6">
    <span class="text-xs font-bold tracking-[0.2em] text-desk-accent">REVIEW DESK</span>
    <h1 class="mt-6 mb-3 text-[clamp(28px,5vw,42px)] font-bold tracking-[-0.04em]">
      投稿审核工作台
    </h1>
    <p class="my-4 leading-[1.8] text-desk-muted">
      项目骨架已创建，业务功能暂未实现。
    </p>
    <el-card
      class="mt-8 rounded-[14px] border-desk-border"
      shadow="never"
    >
      <h2 class="mb-4 text-lg font-bold">
        开发基础
      </h2>
      <ul class="my-3.5 list-disc pl-[22px] text-sm leading-[2.2]">
        <li>前端：Vue 3 + TypeScript + Vite + Element Plus + Tailwind CSS</li>
        <li>后端：Node.js + TypeScript + Fastify</li>
        <li>数据库：本地 SQLite</li>
      </ul>
      <p class="mt-3.5 text-[13px] leading-[1.8] text-desk-muted">
        功能规划见 docs/FEATURES.md，启动方法见 README.md。
      </p>
    </el-card>
  </main>
</template>

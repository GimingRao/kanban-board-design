/**
 * Skill 管理组件导入验证脚本
 *
 * 运行此脚本以验证所有组件是否可以正确导入
 */

import {
  SkillsPage,
  SkillsManagement,
  SkillCard,
  SkillList,
  SkillFilterBar,
  SkillDetailDialog,
  SkillFormDialog,
  CategoryTree,
  Pagination,
} from "../components/skills"

import type { Skill, SkillCategory } from "../lib/types/skill"
import { mockSkills, mockCategories } from "../lib/mocks/skills"

console.log("✅ 所有组件导入成功！")
console.log("✅ 类型定义导入成功！")
console.log("✅ 模拟数据导入成功！")

console.log("\n📦 可用组件:")
console.log("- SkillsPage: 完整的技能管理页面")
console.log("- SkillsManagement: 技能管理组件")
console.log("- SkillCard: 技能卡片组件")
console.log("- SkillList: 技能列表组件")
console.log("- SkillFilterBar: 筛选栏组件")
console.log("- SkillDetailDialog: 详情对话框")
console.log("- SkillFormDialog: 表单对话框")
console.log("- CategoryTree: 分类树组件")
console.log("- Pagination: 分页组件")

console.log("\n📊 模拟数据:")
console.log(`- 技能数量: ${mockSkills.length}`)
console.log(`- 分类数量: ${mockCategories.length}`)

console.log("\n🎉 Skill 管理功能已准备就绪！")

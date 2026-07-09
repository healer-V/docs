import { frontendSidebar } from './sidebar/frontend.js';
import { backendSidebar } from './sidebar/backend.js';
import { crossendSidebar } from './sidebar/crossend.js';
import { operationSidebar } from './sidebar/operation.js';
import { web3Sidebar } from './sidebar/web3.js';
import { aiSidebar } from './sidebar/ai.js';
import { practiceSidebar } from './sidebar/practice.js';
import { moreSidebar } from './sidebar/more.js';

export const sidebar = {
  ...frontendSidebar,
  ...backendSidebar,
  ...crossendSidebar,
  ...operationSidebar,
  ...web3Sidebar,
  ...aiSidebar,
  ...practiceSidebar,
  ...moreSidebar,
};

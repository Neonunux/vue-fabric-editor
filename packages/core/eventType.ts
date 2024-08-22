/*
 * @Author: 秦少卫
 * @Date: 2024-04-10 14:00:05
 * @LastEditors: 秦少卫
 * @LastEditTime: 2024-04-10 14:01:39
 * @Description: 事件类型
 */
// Choice mode
export enum SelectMode {
  EMPTY = '',
  ONE = 'one',
  MULTI = 'multiple',
}

// Select events (for broadcasting)
export enum SelectEvent {
  ONE = 'selectOne',
  MULTI = 'selectMultiple',
  CANCEL = 'selectCancel',
}

export default { SelectMode, SelectEvent };

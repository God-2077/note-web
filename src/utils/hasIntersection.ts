/**
 * 判断两个字符串数组是否存在交集
 * @param {string[]} arr1 - 第一个字符串数组
 * @param {string[]} arr2 - 第二个字符串数组
 * @param {boolean} [ignoreCase=false] - 是否忽略大小写（默认不忽略）
 * @returns {boolean} 存在交集返回true，否则返回false
 */
function hasIntersection(arr1, arr2, ignoreCase = false) {
  // 边界处理：任一数组为空，直接无交集
  if (!arr1.length || !arr2.length) return false;

  // 处理大小写转换（需要时）
  const processItem = (item) => ignoreCase ? item.toLowerCase() : item;

  // 优化性能：用较短的数组创建Set，减少查询成本
  const [shortArr, longArr] = arr1.length < arr2.length ? [arr1, arr2] : [arr2, arr1];
  const itemSet = new Set(shortArr.map(processItem));

  // 遍历较长数组，判断是否有共同元素
  return longArr.some(item => itemSet.has(processItem(item)));
}

// 示例使用
// const arr1 = ["a", "b", "C"];
// const arr2 = ["c", "d", "e"];

// console.log(hasIntersection(arr1, arr2)); // false（默认大小写敏感，"C"≠"c"）
// console.log(hasIntersection(arr1, arr2, true)); // true（忽略大小写，"C"="c"）
// console.log(hasIntersection(["x", "y"], ["z"])); // false（无交集）
// console.log(hasIntersection([], ["a"])); // false（空数组无交集）



// import { hasIntersection } from '../../utils/hasIntersection.ts';
export {
  hasIntersection
}
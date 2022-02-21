const loaderUtils = require('loader-utils')
/**
 * 1. 不管什么样的模块，最左侧的 loader 一定要返回一个 JS 模块代码。
 * 创建一个 style 标签，把 css 文本放在 style 标签里面，然后插入页面
 * @param css
 */
function loader(css) {}

/**
 *
 * @param remainingRequest 剩下的请求
 */
loader.pitch = function (remainingRequest) {
  // 把绝对路径变成可以在本模块内部加载的相对路径
  let request = JSON.stringify(
    this.utils.contextify(this.context, "!!" + remainingRequest)
  )
  console.log(request)
  let moduleScript = `
    let style = document.createElement('style');
    style.innerHTML = require(${request});
    document.head.appendChild(style);
  `;
  return moduleScript;
}

module.exports = loader
const less = require('less');

/**
 * 把 less 编译成 css
 * @param lessSource
 */
function loader(lessSource) {
  // 一旦你调用了 async 方法， 那么此 loader 的执行就会变成异步的，当前 loader 结束后不会自动执行上一个 loader
  // 而是会等待你调用 callback 函数才会继续执行
  let callback = this.async();
  less.render(lessSource, {filename: this.resource}, (err, output) => {
    let script = `module.exports = ${JSON.stringify(output.css)}`
    callback(err, script)
  })
}

module.exports = loader;
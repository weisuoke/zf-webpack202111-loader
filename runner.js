const { runLoaders } = require('loader-runner')
const path = require('path');
const fs = require('fs');

// 入口文件
const entryFile = path.resolve(__dirname, 'src', 'title.js');

// loader的转换规则配置
let rules = [
  {
    test: /title\.js$/,
    use: [
      'normal1-loader.js',
      'normal2-loader.js'
    ]
  },
  {
    test: /title\.js$/,
    enforce: 'post',
    use: [
      'post1-loader.js',
      'post2-loader.js'
    ]
  },
  {
    test: /title\.js$/,
    enforce: 'pre',
    use: [
      'pre1-loader.js',
      'pre2-loader.js'
    ]
  }
]

let request = `inline1-loader!inline2-loader!${entryFile}`
let parts = request.replace(/^-?!+/, "").split('!')  // ['inline1-loader', 'inline2-loader', entryFile]
let resource = parts.pop();
// 用于把 loader 的名称转变成一个绝对路径
const resolveLoader = loader => path.resolve(__dirname, 'loaders', loader)
const inlineLoaders = parts;
const preLoaders = [], postLoaders = [], normalLoaders = [];

rules.forEach(rule => {
  if (resource.match(rule.test)) {
    if (rule.enforce === 'pre') {
      preLoaders.push(...rule.use)
    } else if (rule.enforce === 'post') {
      postLoaders.push(...rule.use)
    } else {
      normalLoaders.push(...rule.use)
    }
  }
})

/**
 * -! noPreAutoLoaders 不要前置和普通 loader
 * ! noAutoLoaders 不要普通 loader
 * !! noPrePostAutoLoaders 只要内联loaderr
 */
// let loaders = [...postLoaders, ...inlineLoaders, ...normalLoaders, ...preLoaders];
let loaders = [];
if (request.startsWith('!!')) {
  loaders = inlineLoaders
} else if (request.startsWith('-!')) {
  loaders = [...postLoaders, ...inlineLoaders]
} else if (request.startsWith('!')) {
  loaders = [...postLoaders, ...inlineLoaders, ...preLoaders]
} else {
  loaders = [...postLoaders, ...inlineLoaders, ...normalLoaders, ...preLoaders]
}
loaders = loaders.map(resolveLoader)
runLoaders({
  resource, // 要加载和转换的模块
  loaders,  // 是一个绝对路径的loader数组
  context: {name: 'zhufeng'}, // loader 上下文对象
  readResource: fs.readFile.bind(fs)  // 读取硬盘上资源的方法
}, (err, result) => {
  console.log(err); // 运行错误
  console.log(result);  // 转换后的结果
  console.log(result.resourceBuffer.toString('utf8'));  // 最初始的转换前的源文件的内容。
})
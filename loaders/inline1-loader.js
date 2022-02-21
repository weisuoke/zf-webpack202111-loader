function loader(source) {
  console.log('inline1');
  return source + '//inline1'
}

loader.pitch = function() {
  console.log('inline1 pitch')
}

// 当 raw = false 的时候，webpack 会把源文件内容转成字符串传给 loader
// 当 raw = true 的时候，webpack 会把源文件文件转成 Buffer 传进来
// loader.raw = false;

module.exports = loader;
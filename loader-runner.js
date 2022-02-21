const fs = require('fs')

/**
 * 创建 loader 对象
 * @param loader loader 的绝对路径
 */
function createLoaderObject(loader) {
  let normal = require(loader);
  let pitch = normal.pitch;
  // loader 是否需要原生的 Buffer 类型的数据
  let raw = normal.raw || false
  return {
    path: loader,
    normal,
    pitch,
    raw,
    data: {},  // 每一个 loader 都可以有一个自己的 data 对象，用来放置自己 loader 的一些信息
    pitchExecuted: false, // 表示当前的 loader 的 pitch 函数已经执行过了
    normalExecuted: false, // 表示当前的 loader 的 normal 函数已经执行过了
  }
}

function runLoaders(options, finalCallback) {
  // 解构参数获取 resource = 要加载的模块，loaders = loader数组，context = loader执行时的this对象 readSource读取文件的方法
  let { resource, loaders = [], context = {}, readResource = fs.readFile } = options
  // 把一个 loader 的路径数组转成 loader 对象数组
  let loaderObjects = loaders.map(createLoaderObject)
  let loaderContext = context;
  loaderContext.resource = resource;  // 加载的模块
  loaderContext.readResource = readResource;  // 读取文件的方法
  loaderContext.loaders = loaderObjects;  // loader 对象数组
  loaderContext.loaderIndex = 0;  // 当前正在执行的 loader 的索引
  loaderContext.callback = null;
  loaderContext.async = null;
  Object.defineProperty(loaderContext, 'request', {
    get() {
      return loaderContext.loaders.map(loader => loader.path).concat(loaderContext.resource).join('!')
    }
  })
  // 从当前 loader 下一个开始生效
  Object.defineProperty(loaderContext, 'remainingRequest', {
    get() {
      return loaderContext.loaders.slice(loaderContext.loaderIndex + 1).map(loader => loader.path).concat(loaderContext.resource).join('!')
    }
  })
  // 从当前 loader 开始生效
  Object.defineProperty(loaderContext, 'currentRequest', {
    get() {
      return loaderContext.loaders.slice(loaderContext.loaderIndex).map(loader => loader.path).concat(loaderContext.resource).join('!')
    }
  })
  // 从当前 loader 之前的
  Object.defineProperty(loaderContext, 'previousRequest', {
    get() {
      return loaderContext.loaders.slice(0, loaderContext.loaderIndex).map(loader => loader.path).join('!')
    }
  })
  Object.defineProperty(loaderContext, 'data', {
    get() {
      return loaderContext.loaders[loaderContext.loaderIndex].data
    }
  })

  /**
   *
   * @param args
   * @param raw loader 想要二进制 Buffer 还是字符串
   */
  function convertArgs(args, raw) {
    if (raw && !Buffer.isBuffer(args[0])){
      // 把不是 Buffer 转成 buffer
      args[0] = Buffer.from(args[0])
    } else if(!raw && Buffer.isBuffer(args[0])) {
      // 把 Buffer 转成字符串
      args[0] = args[0].toString('utf8')
    }
  }

  /**
   * 迭代执行 loader 的 normal 函数
   * @param processOptions 选项
   * @param loaderContext 上下文对象
   * @param args 参数
   * @param pitchingCallback 回调
   */
  function iterateNormalLoaders(processOptions, loaderContext, args, pitchingCallback) {
    if (loaderContext.loaderIndex < 0) {
      return pitchingCallback(null, ...args)
    }
    // 获取当前索引对应的loader对象 post1-loader
    let currentLoader = loaderContext.loaders[loaderContext.loaderIndex];
    if (currentLoader.normalExecuted) {
      loaderContext.loaderIndex--
      return iterateNormalLoaders(processOptions, loaderContext, args, pitchingCallback)
    }
    let normalFn = currentLoader.normal;
    currentLoader.normalExecuted = true;  // 表示当前的 loader 的 normal 函数已经执行过了，而 normal 肯定是有值的。
    convertArgs(args, currentLoader.raw);
    runSyncOrAsync(normalFn, loaderContext, args, (err, ...returnArgs) => {
      if (err) return pitchingCallback(err);
      return iterateNormalLoaders(processOptions, loaderContext, returnArgs, pitchingCallback)
    })
  }

  /**
   * 以同步或者异步的方式调用 fn
   * fn的this指针指向loaderContext
   * 参数 args
   * 执行结束后调用runCallback
   * @param fn
   * @param loaderContext
   * @param args
   * @param runCallback
   */
  function runSyncOrAsync(fn, loaderContext, args, runCallback) {
    // 此函数的执行默认是同步的
    let isSync = true;
    // 动态的给 loaderContext 添加一个 callback 属性， 调用这个 callback，会自动执行下一个 normal loader
    let callback = (...args) => {
      runCallback(...args);
    }
    loaderContext.callback = callback
    loaderContext.async = () => {
      isSync = false;  // 把当前的 loader 执行从同步变成异步
      return callback
    }
    // 用 loaderContext 作为 this, 用 args 作为参数调用 fn 函数，获取返回值
    let result = fn.apply(loaderContext, args)
    // 如果 isSync 为 true, 说明是同步执行，直接 自动调用 callback 向下执行。
    if (isSync) {
      callback(null, result);
    }
    // 如果它是异步的呢？什么都不做
  }

  /**
   * 读取源文件的内容
   * @param processOptions  参数
   * @param loaderContext loader 执行的上下文
   * @param pitchingCallback pitching 回调
   */
  function processResource(processOptions, loaderContext, pitchingCallback) {
    processOptions.readResource(loaderContext.resource, (err, resourceBuffer) => {
      processOptions.resourceBuffer = resourceBuffer; // 把读到的文件的 buffer 传递给 processOptions.resourceBuffer.
      loaderContext.loaderIndex--;  // 让 loaderContext.loaderIndex = 7
      iterateNormalLoaders(processOptions, loaderContext, [resourceBuffer], pitchingCallback)
    })
  }
  function iteratePitchingLoaders(processOptions, loaderContext, pitchingCallback) {
    if (loaderContext.loaderIndex >= loaderContext.loaders.length) {
      return processResource(processOptions, loaderContext, pitchingCallback)
    }
    // 获取当前索引对应的loader对象 post1-loader
    let currentLoader = loaderContext.loaders[loaderContext.loaderIndex];
    if (currentLoader.pitchExecuted) {
      loaderContext.loaderIndex++
      return iteratePitchingLoaders(processOptions, loaderContext, pitchingCallback)
    }
    let pitchFn = currentLoader.pitch;
    currentLoader.pitchExecuted = true; // 表示当前的 loader 的pitch函数已经执行过了
    if (!pitchFn) {
      return iteratePitchingLoaders(processOptions, loaderContext, pitchingCallback)
    }
    runSyncOrAsync(pitchFn, loaderContext, [
      loaderContext.remainingRequest,
      loaderContext.previousRequest,
      loaderContext.data
    ], (err, ...returnArgs) => {
      if (returnArgs.length > 0 && returnArgs.some(arg => arg)) {
        loaderContext.loaderIndex--;
        iterateNormalLoaders(processOptions, loaderContext, returnArgs, pitchingCallback)
      } else {
        return iteratePitchingLoaders(processOptions, loaderContext, pitchingCallback)
      }
    })
  }
  let processOptions = {
    resourceBuffer: null, // 当你真正读取源文件的时候会把源文件 Buffer 对象传递过来
    readResource
  }
  iteratePitchingLoaders(processOptions, loaderContext, (err, result) => {
    finalCallback(err, {
      result,
      resourceBuffer: processOptions.resourceBuffer
    })
  });
}

exports.runLoaders = runLoaders
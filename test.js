function flatten(arr) {
    return [].concat(...arr)
  }


  console.log(flatten([1,2,[1,[2]]]))
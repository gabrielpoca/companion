export const wait = async (timeout = 1000) => {
  return new Promise(resolve => {
    setInterval(resolve, timeout);
  });
};

export const asciiToHex = str => {
  var arr1 = [];
  for (var n = 0, l = str.length; n < l; n++) {
    var hex = Number(str.charCodeAt(n)).toString(16);
    arr1.push(hex);
  }
  return arr1.join("");
};

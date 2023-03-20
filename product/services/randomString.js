const _self = {
  randomString: function randomString(len,an) {
    an = an && an.toLowerCase();
    let str = "",
      i = 0,
      min = an == "a" ? 10 : 0,
      max = an == "n" ? 10 : 62;
    for (; i++ < len;) {
      let r = Math.random() * (max - min) + min << 0;
      str += String.fromCharCode(r += r > 9 ? r < 36 ? 55 : 61 : 48);
    }
    return str;
  },
 randomNumber: function(n){
  return Math.floor(Math.random() * (9 * Math.pow(10, n - 1))) + Math.pow(10, n - 1);
 } 
};
module.exports = _self;


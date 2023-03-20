import moment from "moment";

const _self = {
  now: function now() {
    return moment()
      .utc()
      .toISOString();
  },

  utcDateFormat: date => {
    return moment(date.toString())
      .utc()
      .format();
  },

  addDaysToDate: days => {
    return moment()
      .date(moment().date() + days)
      .utc()
      .toISOString();
  },

  removeDaysToDate: days => {
    return moment()
      .date(moment().date() - days)
      .utc()
      .toISOString();
  },

  getTime: function getTime() {
    return moment().valueOf();
  },

  getDate: function getDate() {
    return moment().format("YYYY/MM/DD");
  },

  getUnixTime: () => {
    return moment().unix();
  },

  isoString: date => {
    return moment(date)
      .utc()
      .format();
  },

  //Date in utc
  getOffsetTime: (date, offset) => {
    return moment(date)
      .utcOffset(offset)
      .format();
  },

  getTimezoneTime: (date, offset) => {
    return moment
      .utc(date)
      .utcOffset(offset / 60)
      .format("llll");
  },

  randomString: length => {
    var characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(moment().valueOf() * charactersLength)
      );
    }
    return result;
  }
};

module.exports = _self;

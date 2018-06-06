//app.js
import io from './wxsocket.io/index';

App({
  onLaunch: function () {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    });
    this.setAuth();
    this.globalData.socket = io("wss://127.0.0.1:8000", {
      "transports": ['websocket','polling']
    });
    this.globalData.socket.on('chess_join', d => {
      this.globalData.getRoomUser(false, this.globalData.roomId, "add");
    });
    this.globalData.socket.on('chess_records_update', d => {
      this.globalData.getGool();
    });
    this.globalData.socket.on('chess_leave', d => {
      this.globalData.getRoomUser(false, this.globalData.roomId, "leave");
    });
  },
  setAuth() {
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          this.setUserInfo();
        }
      }
    })
  },
  setUserInfo() {
    wx.getUserInfo({
      success: res => {
        // 可以将 res 发送给后台解码出 unionId
        this.globalData.userInfo = res.userInfo;
        // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
        // 所以此处加入 callback 以防止这种情况
        if (this.userInfoReadyCallback) {
          this.userInfoReadyCallback(res)
        }
      }
    })
  },
  kickOutUser(room_id, user_id) {
    const _this = this;
    wx.request({
      url: 'https://mini.zgyjyx.net/api/room/' + room_id + '/members/' + user_id,
      header: {
        'content-type': 'application/json' // 默认值
      },
      method: "DELETE",
      success: function (res) {
        _this.globalData.socket.emit('leave_chess_room', {
          room: room_id
        });
      }
    })
  },
  onHide(){
    if (this.globalData.now_user_id && this.globalData.roomId) {
      this.kickOutUser(this.globalData.roomId, this.globalData.now_user_id);
    }
  },
  globalData: {
    userInfo: null,
    roomId:null,
    now_user_id:null,
    socket:null,
    getGool:null,
    getRoomUser:null
  }
})
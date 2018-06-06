//index.js
//获取应用实例
const app = getApp();
Page({
  data: {
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    defaultSize: 'default',
    primarySize: 'default',
    warnSize: 'default',
    disabled: false,
    plain: false,
    loading: false,
    popup: false,
    type: "add",
    roomName: null,
    roomPassword: null,
    animationData: {},
    userRoomInfo: {},
    roomId:null,
    hasOldRoom:null,
    createRoom:false,
    nowRoomIdList:[],
  },
  //事件处理函数
  // bindViewTap: function () {
  //   wx.navigateTo({
  //     url: '../logs/logs'
  //   })
  // },
  setRoomName(e) {
    this.setData({
      roomName: e.detail.value
    })
  },
  setRoomPassWord(e) {
    this.setData({
      roomPassword: e.detail.value
    })
  },
  createRoom: function () {
    const _this = this;
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        wx.request({
          url: 'https://mini.zgyjyx.net/api/wechat/', //仅为示例，并非真实的接口地址
          header: {
            'content-type': 'application/json' // 默认值
          },
          method: "GET",
          data: {
            js_code: res.code,
            nickname: this.data.userInfo.nickName,
            headimg: this.data.userInfo.avatarUrl
          },
          success: function (res) {
            if (res.data.user) {
              _this.setData({
                userRoomInfo: res.data
              });
              _this.createRoomSuccess()
              // _this.addRomeSure(res.data,"create");
            }
          }
        })
      }
    });
  },
  createRoomSuccess() {
    this.animateFadeIn();
    this.setData({
      popup: true,
      type: "create"
    });
  },
  addRoom: function () {
    // this.setData({
    //   popup: true,
    //   type: "add"
    // });
    wx.scanCode({
      success: (res) => {
        wx.navigateTo({
          url: "/" + res.path
        })
      },
      fail: (res) => {
        console.log(res)
      }
    })
  },
  addOldRoomBegin(){
    this.animateFadeIn();
    this.setData({
      hasOldRoom: true
    });
  },
  canncal(){
    this.animateFadeOut();
    setTimeout(()=>{
      this.setData({
        hasOldRoom: false
      })
    },600);
  },
  animateFadeIn() {
    var animation = wx.createAnimation({
      duration: 600,
      timingFunction: 'ease',
    })

    this.animation = animation

    animation.opacity(0).step();

    this.setData({
      animationData: animation.export()
    })

    setTimeout(function () {
      animation.opacity(1).step()
      this.setData({
        animationData: animation.export()
      })
    }.bind(this), 1);
  },
  animateFadeOut() {
    var animation = wx.createAnimation({
      duration: 600,
      timingFunction: 'ease',
    })

    this.animation = animation

    animation.opacity(1).step();

    this.setData({
      animationData: animation.export()
    })

    setTimeout(function () {
      animation.opacity(0).step()
      this.setData({
        animationData: animation.export()
      })
    }.bind(this), 1)
  },
  addRomeSure: function () {
    let { createRoom, roomIdList } = this.data;
    const _this = this;
    if (createRoom){
      return false;
    }
    this.setData({
      createRoom:true
    });
    const roomName = this.data.roomName;
    // this.animateFadeOut();
    const userInfo =  this.data.userRoomInfo;
    const type = this.data.type;
    wx.showLoading({
      title: "正在创建房间...",
      mask: true
    });
    if (type == "create") {
      // wx.clearStorage();
      wx.removeStorageSync('roomId');
      wx.request({
        url: 'https://mini.zgyjyx.net/api/room/', //仅为示例，并非真实的接口地址
        header: {
          'content-type': 'application/json' // 默认值
        },
        method: "POST",
        data: {
          author_id: userInfo.user.id
        },
        success: function (res) {
          wx.hideLoading();
          if (res.data.id) {
            wx.navigateTo({
              url: '/pages/room/room?room_id=' + res.data.id + '&member=' + res.data.author_id + '&roomName=' + res.data.user.username
            });
            setTimeout(()=>{
              _this.setData({
                createRoom: false
              });
            },1000)
          }
        },
        fail: function () {
          wx.hideLoading();
        },
        complete: function () {
          wx.hideLoading();
        }
      });
    }
    setTimeout(() => {
      this.setData({
        popup: false
      });
    }, 600);
  },
  closePop: function () {
    var animation = wx.createAnimation({
      duration: 600,
      timingFunction: 'ease',
    })

    this.animation = animation

    animation.opacity(1).step();

    this.setData({
      animationData: animation.export()
    })

    setTimeout(function () {
      animation.opacity(0).step()
      this.setData({
        animationData: animation.export()
      })
    }.bind(this), 1);
    setTimeout(() => {
      this.setData({
        popup: false
      });
    }, 600);
  },
  addOldRoom(){
    const { roomId} = this.data;
    if (roomId) {
      this.setData({
        hasOldRoom: false
      })
      wx.navigateTo({
        url: '/pages/room/room?room_id=' + roomId
      })
    }
  },
  selectRoom(event){
    var item = event.currentTarget.dataset.replay;
    this.setData({
      roomId:item.id
    })
  },
  onShow(){
    let roomId = app.globalData.roomId || wx.getStorageSync('roomId');
    let roomIdList = wx.getStorageSync('roomIdList');
    roomIdList = roomIdList ? JSON.parse(roomIdList) : [];
    let nowRoomIdList = [];
    roomIdList.map((item) => {
      if (new Date().getTime() - new Date(item.date).getTime() < 48 * 60 * 60 * 1000) {
        nowRoomIdList = [...nowRoomIdList, item];
      }
    });
    nowRoomIdList.sort((a, b) => {
      return b.id - a.id
    });
    wx.setNavigationBarTitle({
      title: "老板有点忙"
    });
    roomId = nowRoomIdList.length>0?nowRoomIdList[0].id:null;
    this.setData({
      nowRoomIdList,
      roomId
    })
    if (roomId) {
      this.setData({
        hasOldRoom: false,
      })
    }
    this.setData({
      roomId
    });
  },
  onLoad: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  getUserInfo: function (e) {
    app.globalData.userInfo = e.detail.userInfo;
    if (e.detail.userInfo) {
      this.createRoom();
      this.setData({
        userInfo: e.detail.userInfo,
        hasUserInfo: true
      })
    }
  }
})

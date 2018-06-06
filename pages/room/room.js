const app = getApp();
// import io from '../../wxsocket.io/index';

Page({
  data: {
    games: [],
    userInfo: {},
    hasUserInfo: false,
    user: [],
    add: false,
    scrollTop: 0,
    width: 0,
    total: [],
    showWchat: false,
    come: false,
    animationData: {},
    kickOut: false,
    author_id: null,
    user_id: null,
    kickUserId: null,
    wechat: null,
    now_user_id: null,
    roomId: null,
    leave_user: [],
    now_leave_user: {},
    add_room_user: {},
    addUserInfo: false,
    headImg: null,
    username: null,
    addus: false,
    addSao: false,
  },
  getRoomUser(isFirst, roomId, roomStatus) {
    let [user] = [[]];
    let roomIdList = wx.getStorageSync('roomIdList');
    roomIdList = roomIdList && roomIdList != "" ? JSON.parse(roomIdList) : [];
    let sUser = [];
    roomIdList && roomIdList.map((item) => {
      if (item.id == roomId) {
        sUser = item.user ? item.user : [];
      }
    });
    let back_user = this.data.user;
    roomId = roomId || this.data.roomId;
    const _this = this;
    let { leave_user, now_leave_user, now_user_id } = this.data;
    wx.request({
      url: 'https://mini.zgyjyx.net/api/room/' + roomId,
      header: {
        'content-type': 'application/json' // 默认值
      },
      method: "GET",
      success: function (res) {
        if (res && res.data && res.data.id) {
          res.data.members && res.data.members.length > 0 && res.data.members.map((item) => {
            user = [...user, { id: item[0], status: item[1], type: 1, gool: "" }];
          });
          res.data.headimgs && res.data.headimgs.length > 0 && res.data.headimgs.map((item, i) => {
            user && user.length > 0 && user.map((inItem, j) => {
              if (inItem.id == item.uid) {
                inItem.img = item.img;
                inItem.nickname = item.nickname;
              }
            })
          });
          user = [...user, { id: "pai", status: 1, type: 1, gool: "", nickname: "台板", img: "https://mini.zgyjyx.net/api/wechat/qrcode/?path=pages/room/room?room_id=" + roomId }];
          if (roomStatus == "add") {
            const result = [];
            for (let i = 0; i < user.length; i++) {
              let obj = user[i];
              let num = obj.id;
              let isExist = false;
              for (let j = 0; j < back_user.length; j++) {
                let aj = back_user[j];
                let n = aj.id;
                if (n == num) {
                  isExist = true;
                  break;
                }
              }
              if (!isExist) {
                result.push(obj);
              }
            }
            if (result && result.length > 0) {
              wx.showToast({
                title: result[0].nickname + "加入房间",
                icon: 'none',
                duration: 2000,
              });
            }
            if (leave_user.length > 0) {
              const end_leave_user = [];
              for (let i in leave_user) {
                let obj = leave_user[i];
                let num = obj.id;
                let isExist = false;
                for (let j in result) {
                  let aj = result[j];
                  let n = aj.id;
                  if (n == num) {
                    isExist = true;
                    break;
                  }
                }
                if (!isExist) {
                  end_leave_user.push(obj);
                }
              }
              leave_user = end_leave_user;
            }
          }
          if (roomStatus == "leave") {
            user && user.map((item) => {
              if (item.status == 0 && JSON.stringify(leave_user).indexOf(JSON.stringify(item)) < 0) {
                now_leave_user.id = item.id;
                now_leave_user.nickname = item.nickname;
                leave_user = [...leave_user, item];
                wx.showToast({
                  title: item.nickname + "离开房间",
                  icon: 'none',
                  duration: 2000,
                });
                if (item.id == now_user_id) {
                  wx.reLaunch({
                    url: '/pages/index/index'
                  })
                }
              }
            })
          };
          if (user && user.length > 2) {
            _this.setData({
              addSao: true
            })
          }
          user = sUser.length > 0 ? _this.unique(sUser, user) : user;
          // user = user && user.sort((a, b) => {
          //   return b.status - a.status
          // });
          _this.setData({
            user: sUser.length > 0 ? sUser : user,
            width: 137 * user.length,
            now_leave_user,
            addus: sUser.length > 0 ? true : false,
            leave_user,
            now_user_id,
            author_id: res.data.author_id,
            user_id: res.data.members.length > 0 && res.data.members[0] && res.data.members[0][0]
          });
          wx.hideLoading();
          if (isFirst) {

          }
          _this.getGool();
        }
      },
      fail: function () {
        wx.hideLoading();
      },
      complete: function () {
        wx.hideLoading();
      }
    });
  },
  unique(arr1, arr2) {
    var arr = arr1.concat();
    //或者使用slice()复制，var arr = arr1.slice(0)  
    for (var i = 0; i < arr2.length; i++) {
      JSON.stringify(arr).indexOf(JSON.stringify(arr2[i])) === -1 ? arr.push(arr2[i]) : 0;
    }
    return arr;
  },
  getWechatUserInfo(user, roomId) {
    if (app.globalData.userInfo) {
      this.addRoom(user, roomId);
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.addRoom(user, roomId);
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          this.addRoom(user, roomId);
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: options.room_id + "房间"
    });
    let roomIdList = wx.getStorageSync('roomIdList');
    roomIdList = roomIdList ? JSON.parse(roomIdList) : [];
    let nowRoomIdList = [];
    let addRoomId = { id: options.room_id, date: new Date() };
    let str = '"id":' + '"' + options.room_id + '"';
    if (JSON.stringify(roomIdList).indexOf(str) < 0) {
      roomIdList = [...roomIdList, addRoomId];
    }
    roomIdList.map((item) => {
      if (new Date().getTime() - new Date(item.date).getTime() < 48 * 60 * 60 * 1000) {
        nowRoomIdList = [...nowRoomIdList, item];
      }
    })
    nowRoomIdList = JSON.stringify(nowRoomIdList);
    wx.setStorageSync("roomId", options.room_id);
    wx.setStorageSync('roomIdList', nowRoomIdList)
    app.globalData.roomId = options.room_id;
    app.globalData.getRoomUser = this.getRoomUser;
    app.globalData.getGool = this.getGool;
    this.roomGlobal.come = options.come ? options.come : false;
  },
  onShow() {
    wx.showLoading({
      title: "正在加载中...",
      mask: true
    });
    this.getWechatUserInfo(this.data.user, app.globalData.roomId);
    this.setData({
      come: this.roomGlobal.come,
      roomId: app.globalData.roomId,
    });
  },
  onReady() {
    this.cameraContext = wx.createCameraContext('this');
  },
  onUnload: function (options) {
    const { now_user_id, roomId } = this.data;
    this.kickOutUser(roomId, now_user_id);
  },
  onShareAppMessage: function () {
    const { roomId, addus } = this.data;
    if (!addus) {
      return {
        title: '老板有点忙',
        path: '/pages/room/room?room_id=' + roomId + '&come=share',
        imageUrl: "https://mini.zgyjyx.net/api/wechat/qrcode/?path=pages/room/room?room_id=" + roomId,
        success: function (res) {
          // 转发成功
        },
        fail: function (res) {
          // 转发失败
        }
      }
    } else {
      return {
        title: '老板有点忙',
        path: 'pages/index/index',
        imageUrl: "https://mini.zgyjyx.net/api/wechat/qrcode/?path=pages/room/room?room_id=" + roomId,
        success: function (res) {
          // 转发成功
        },
        fail: function (res) {
          // 转发失败
        }
      }
    }

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
  kickOutMember(e) {
    const kickUserId = e.currentTarget.dataset.replay.id;
    if (e.currentTarget.dataset.replay.status == 0) {
      return false;
    }
    const { author_id, user_id } = this.data;
    if (kickUserId != user_id && kickUserId != "pai") {
      this.animateFadeIn();
      this.setData({
        kickOut: true,
        kickUserId
      });
    }
  },
  closeKickOut() {
    this.animateFadeOut();
    setTimeout(() => {
      this.setData({
        kickOut: false
      });
    }, 600)
  },
  KickOutPerson() {
    this.animateFadeOut();
    const { kickUserId, roomId } = this.data;
    this.kickOutUser(roomId, kickUserId);
    setTimeout(() => {
      this.setData({
        kickOut: false
      });
    }, 600)
  },
  kickOutUser(room_id, user_id) {
    const { now_user_id } = this.data;
    wx.request({
      url: 'https://mini.zgyjyx.net/api/room/' + room_id + '/members/' + user_id,
      header: {
        'content-type': 'application/json' // 默认值
      },
      method: "DELETE",
      success: function (res) {
        app.globalData.socket.emit('leave_chess_room', {
          room: room_id
        });
      }
    })
  },
  showWchat() {
    this.animateFadeIn();
    const { roomId } = this.data;
    this.setData({
      showWchat: true,
      wechat: "https://mini.zgyjyx.net/api/wechat/qrcode/?path=pages/room/room?room_id=" + roomId
    });
  },
  imageError() {
    const { roomId } = this.data;
    this.setData({
      wechat: "https://mini.zgyjyx.net/api/wechat/qrcode/?path=pages/room/room?room_id=" + roomId
    });
  },
  hideWchat() {
    const roomName = this.data.roomName;
    this.animateFadeOut();
    setTimeout(() => {
      this.setData({
        showWchat: false
      });
    }, 600)
  },
  layOut() {
    wx.reLaunch({
      url: '/pages/index/index'
    })
  },
  setGool: function (event) {
    if (event.detail.value == "") {
      var item = event.currentTarget.dataset.replay;
      var user = this.data.user;
      user[item].gool = Math.abs(event.detail.value);
    }
    if (isNaN(event.detail.value)) {
      wx.showToast({
        title: '请输入一个数字',
        icon: 'none',
        duration: 2000,
      });
      return;
    }
    var item = event.currentTarget.dataset.replay;
    var user = this.data.user;
    user[item].gool = event.detail.value!=""?Math.abs(event.detail.value):"";
  },
  saveGame: function () {
    const { user, roomId } = this.data;
    const _this = this;
    let records = [];
    var totalGool = 0;
    let onGame = [];
    let hasGool = false;
    user.map((item) => {
      if (item.gool.toString() == "0" || item.gool != "") {
        hasGool = true
      }
    });
    if (!hasGool) {
      return false;
    }
    user.map((item) => {
      let gool = item.gool == "" ? 0 : item.type == 1 ? item.gool : -item.gool;
      totalGool = totalGool * 1 + gool * 1;
    });
    if (totalGool != 0) {
      wx.showToast({
        title: totalGool > 0 ? '多出' + totalGool : '少了' + totalGool,
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    user.map((item) => {
      let gool = item.gool ? item.gool : 0;
      records = [...records, [item.id, item.type == 1 ? gool : -gool]]
    });
    records = [...records, parseInt((new Date().getTime()) / 1000)];
    user.map((item) => {
      item.type = 1;
      item.gool = "";
    });
    wx.showLoading({
      title: "正在保存分数...",
      mask: true
    });
    wx.request({
      url: 'https://mini.zgyjyx.net/api/room/' + roomId + '/room_record', //仅为示例，并非真实的接口地址
      header: {
        'content-type': 'application/json' // 默认值
      },
      method: "POST",
      data: {
        records: records
      },
      success: function (res) {
        if (res.statusCode == 200) {
          _this.setData({
            add: false,
            user
          });
          wx.showToast({
            title: '保存成功',
            icon: 'none',
            duration: 2000
          });
        }
      }
    });
  },
  getGool() {
    let { roomId, user } = this.data;
    let games = [];
    let total = [];
    const _this = this;
    wx.request({
      url: 'https://mini.zgyjyx.net/api/room/' + roomId + '/room_record', //仅为示例，并非真实的接口地址
      header: {
        'content-type': 'application/json' // 默认值
      },
      method: "GET",
      success: function (res) {
        if (res.statusCode == 200) {
          res.data && res.data.records && res.data.records.length > 0 && res.data.records.map((item, i) => {
            let onGame = [];
            item && Array.isArray(item) && item.map((inItem, j) => {
              if (j == item.length - 1) {
                return false;
              }
              onGame = [...onGame, { id: inItem[0], gool: Math.abs(inItem[1]), type: inItem[1] >= 0 ? 1 : 0 }];
            });
            games = [...games, onGame];
          });
        }
        //在games里面添加新用户信息
        user.map((item, i) => {
          games && games.map((wItem, j) => {
            if (!wItem[i]) {
              wItem[i] = { status: 1, type: 1, gool: 0 }
            }
          });
        });
        games && games.map((item, i) => {
          item && item.map((inItem, j) => {
            if (inItem.id == "pai") {
              let back = item[j];
              item[j] = item[item.length - 1];
              item[item.length - 1] = back;
            }
          })

        });

        //在games里面id对应
        user.map((item, i) => {
          games && games.map((wItem, j) => {
            wItem[i].id = user[i].id
          });
        });

        //games 排序
        games && games.map((item) => {
          for (let i in item) {
            for (let j in user) {
              if (item[i].id == user[j].id) {
                let back = item[i];
                item[i] = item[j];
                item[j] = back;
              }
            }
          }
        });
        //计算总分数
        user && user.map((item, i) => {
          let gool = 0;
          let onInfo = {};
          games && games.map((inItem) => {
            inItem && inItem.map((liItem, i) => {
              if (liItem.id == item.id) {
                liItem.status = item.status;
                let typeNow = liItem ? liItem.type : 1;
                let goolNow = liItem ? liItem.gool : 0;
                let isGool = typeNow == 1 ? goolNow : -goolNow;
                gool = gool + isGool;
                onInfo = { id: item.id, status: user[i] ? user[i].status : 1, gool: Math.abs(gool), type: gool >= 0 ? 1 : 0 };
              };
            })
          });
          onInfo.type = onInfo.type || onInfo.type == 0 ? onInfo.type : 1;
          onInfo.status = user[i] ? user[i].status : 1;
          onInfo.gool = onInfo.gool ? onInfo.gool : 0;
          total = [...total, onInfo];
        });
        wx.hideLoading();
        _this.setData({
          scrollTop: 180 * (games.length + 1) + 102,
          games,
          total
        });
      },
      fail: function () {
        wx.hideLoading();
      },
      complete: function () {
        wx.hideLoading();
      }
    })
  },
  typeChange: function (event) {
    var item = event.currentTarget.dataset.replay;
    var user = this.data.user;
    if (user[item].type == 1) {
      user[item].type = 0
    } else {
      user[item].type = 1
    }
    this.setData({
      user
    });
  },
  focusEve() {
    this.setData({
      scrollTop: 180 * (this.data.games.length + 1) + 182,
    })
  },
  addRoom(user, roomId) {
    roomId = roomId || this.data.roomId;
    const _this = this;
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        wx.request({
          url: 'https://mini.zgyjyx.net/api/wechat/',
          header: {
            'content-type': 'application/json' // 默认值
          },
          method: "GET",
          data: {
            js_code: res.code,
            nickname: _this.data.userInfo.nickName,
            headimg: _this.data.userInfo.avatarUrl
          },
          success: function (res) {
            _this.personAddRoom(res.data.user.id, user, roomId);
            app.globalData.now_user_id = res.data.user.id;
            _this.setData({
              now_user_id: res.data.user.id
            });
          }
        })
      }
    });
  },
  personAddRoom(member, user, roomId) {
    roomId = roomId || this.data.roomId;
    const _this = this;
    wx.request({
      url: 'https://mini.zgyjyx.net/api/room/' + roomId + '/members',
      header: {
        'content-type': 'application/json' // 默认值
      },
      method: "PUT",
      data: {
        members: member
      },
      success: function (res) {
        app.globalData.socket.emit('join_chess_room', {
          room: roomId
        });
      }
    })
  },
  addUser() {
    this.animateFadeIn();
    this.setData({
      addUserInfo: true,
      headImg: null
    })
  },
  closeAddUserInfo() {
    this.animateFadeOut();
    setTimeout(() => {
      this.setData({
        addUserInfo: false
      })
    }, 600)
  },
  addUserInfo() {
    let { user, headImg, username, games, roomId } = this.data;
    let total = [];
    if (!username) {
      wx.showToast({
        title: "请输入用户名",
        icon: 'none',
        duration: 2000,
      });
      return false;
    } else if (!headImg) {
      wx.showToast({
        title: "请添加头像",
        icon: 'none',
        duration: 2000,
      });
      // return false;
    }
    wx.showLoading({
      title: "正在添加用户...",
      mask: true
    });
    //添加进用户表
    user = [...user, { id: encodeURI(headImg) + user.length, status: 1, type: 1, gool: "", nickname: username, img: headImg }];
    //在games里面添加新用户信息
    user.map((item, i) => {
      games && games.map((wItem, j) => {
        if (!wItem[i]) {
          wItem[i] = { id: user[i].id, status: 1, type: 1, gool: 0 }
        }
      });
    });
    //用户排序
    user.map((item, i) => {
      if (item.id == "pai") {
        let back = user[i];
        user[i] = user[user.length - 1];
        user[user.length - 1] = item;
      }
    });
    //games信息根据用户排序
    user.map((item, i) => {
      games && games.map((wItem, j) => {
        wItem && wItem.map((inItem, k) => {
          if (item.id == inItem.id) {
            let back = wItem[k];
            wItem[k] = wItem[i];
            wItem[i] = back;
          }
        })
      })
    });

    //获取总分数
    user && user.map((item, i) => {
      let gool = 0;
      let onInfo = {};
      games && games.map((inItem) => {
        inItem && inItem.map((liItem, i) => {
          if (liItem.id == item.id) {
            let typeNow = liItem ? liItem.type : 1;
            let goolNow = liItem ? liItem.gool : 0;
            let isGool = typeNow == 1 ? goolNow : -goolNow;
            gool = gool + isGool;
            onInfo = { id: item.id, status: user[i].status, gool: Math.abs(gool), type: gool >= 0 ? 1 : 0 };
          };
        })
      });
      onInfo.type = onInfo.type || onInfo.type == 0 ? onInfo.type : 1;
      onInfo.status = user[i].status;
      onInfo.gool = onInfo.gool ? onInfo.gool : 0;
      total = [...total, onInfo];
    });
    let roomIdList = wx.getStorageSync('roomIdList');
    roomIdList = roomIdList ? JSON.parse(roomIdList) : [];
    roomIdList.map((item) => {
      if (item.id == roomId) {
        item.user = user
      }
    })
    wx.setStorageSync("roomIdList", JSON.stringify(roomIdList));
    this.animateFadeOut();
    setTimeout(() => {
      wx.hideLoading();
      this.setData({
        addUserInfo: false,
        user,
        width: 137 * user.length,
        addus: true,
        games,
        total
      })
    }, 600)
  },
  setUserName(event) {
    this.setData({
      username: event.detail.value
    })
  },
  takePhotoAgain() {
    this.setData({
      headImg: null
    })
  },
  takePhoto() {
    const { user } = this.data;
    this.cameraContext.takePhoto({
      quality: 'high',
      success: (res) => {
        this.setData({
          headImg: res.tempImagePath
        })
      }
    });
  },
  takePhotoError(e) {
    wx.openSetting({
      success: (res) => {
        res.authSetting = {
          "scope.camera": true
        }
        this.setData({
          addUserInfo: false,
        })
      }
    })
  },
  getUserInfo: function (e) {
    app.globalData.userInfo = e.detail.userInfo;
    let user = this.data.user;
    if (e.detail.userInfo) {
      this.addRoom(user);
      this.setData({
        userInfo: e.detail.userInfo,
        hasUserInfo: true
      })
    }
  },
  roomGlobal: {
    come: false,
  }
})
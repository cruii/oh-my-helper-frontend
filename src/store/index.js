import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: undefined,
    users: [],
    screenLoading: false,
    cols: 12
  },
  mutations: {
    setUser (state, user) {
      state.user = user
    },
    listUsers: (state, pageInfo) => {
      state.screenLoading = true
      state.users = []
      axios.get(`bilibili/users?page=${pageInfo.page}&size=${pageInfo.size}`).then(res => {
        state.users = res.data
      }).finally(() => {
        state.screenLoading = false
      })
    },
    setScreenLoading: (state, data) => {
      state.screenLoading = data
    },
    setCols (state, cols) {
      console.log(cols)
      state.cols = cols
    }
  },
  actions: {},
  modules: {}
})

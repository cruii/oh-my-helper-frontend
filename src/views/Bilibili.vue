<template>
  <div>
    <div v-if="user">
      <v-btn
        v-show="!screenLoading"
        :disabled="!$cookies.get('dedeuserid')"
        class="mx-2"
        :dark="user !== null"
        color="#ee8c62"
        elevation="10"
        @click.stop="createTaskDialogVisible = true"
      >
        <v-icon small dark>
          {{ user && user.biliTaskConfigId ? 'mdi-pencil' : 'mdi-plus' }}
        </v-icon>
        {{ user && user.biliTaskConfigId ? '编辑任务' : '新增任务' }}
      </v-btn>

      <v-btn
        v-show="!screenLoading && user.biliTaskConfigId"
        :disabled="!user || !user.biliTaskConfigId"
        class="mx-2"
        color="#FC667A"
        :dark="user !== null"
        elevation="10"
        @click.stop="removeTaskDialogVisible = true"
      >
        <v-icon small>
          mdi-delete
        </v-icon>
        删除任务
      </v-btn>
    </div>

    <div class="ma-3">
      <v-row>
        <v-col cols="12" xs="12" sm="6" md="4" lg="3" xl="2" v-for="(item, i) in users.records" :key="i">
          <card :item="item"></card>
        </v-col>
      </v-row>
    </div>

    <div
      v-if="users.records && users.records.length > 0"
      style="margin-top: 20px">
      <v-pagination
        v-model="pageInfo.page"
        :length="users.pages"
        total-visible="7"
      ></v-pagination>
    </div>

    <v-overlay z-index="1"
      light opacity="0.10" :value="screenLoading">
      <v-progress-circular
        indeterminate
        size="100"
        color="white"
      >
        <v-icon>mdi-robot-angry</v-icon>
      </v-progress-circular>
    </v-overlay>

    <v-dialog
      v-model="createTaskDialogVisible"
      fullscreen
      hide-overlay
      transition="dialog-bottom-transition"
      @close="resetTaskConfig"
      scrollable
    >
      <v-card tile>
        <v-toolbar
          flat
          dark
          style="background-image: linear-gradient(120deg, #fccb90 0%, #d57eeb 100%)"
        >
          <v-btn
            icon
            dark
            @click="createTaskDialogVisible = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>Settings</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-toolbar-items>
            <v-btn
              dark
              text
              @click="createTask"
              :loading="createTaskLoading"
            >
              保存
            </v-btn>
          </v-toolbar-items>
        </v-toolbar>
        <v-card-text>
          <v-form
            ref="createTaskForm"
            v-model="valid"
          >
            <v-container>
              <v-subheader>投币设置</v-subheader>
              <v-row>
                <v-col
                  cols="6"
                  md="4"
                >
                  <v-text-field
                    label="每日投币数量"
                    :rules="[rules.required,rules.isNumber,rules.donateCoinsRange]"
                    hint="每日投币数量,默认 5 ,为 0 时则不投币"
                    v-model="config.donateCoins"
                  ></v-text-field>
                </v-col>
                <v-col
                  cols="6"
                  md="4"
                >
                  <v-text-field
                    label="保留硬币数量"
                    :rules="[rules.reserveCoins]"
                    hint="预留的硬币数，当小于这个值时，不会进行投币任务"
                    v-model="config.reserveCoins"
                  ></v-text-field>
                </v-col>

                <v-col
                  cols="6"
                  md="4"
                >
                  <v-select
                    :items="coinAddPriorities"
                    label="投币策略"
                    item-text='name'
                    item-value='id'
                    v-model="config.donateCoinStrategy"
                  >
                  </v-select>
                </v-col>
              </v-row>

              <v-subheader>漫画签到设置</v-subheader>
              <v-row>
                <v-col
                  cols="12"
                  sm="6"
                  md="4">
                  <v-select
                    :items="platforms"
                    item-text="label"
                    item-value="value"
                    v-model="config.devicePlatform"
                    label="漫画签到平台"
                    hint="手机端漫画签到时的平台，建议选择你设备的平台"
                  ></v-select>
                </v-col>
              </v-row>
              <v-subheader>直播间过期礼物设置</v-subheader>
              <v-row>
                <v-col
                  cols="6"
                  sm="4"
                  md="4"
                >
                  <v-text-field
                    label="礼物赠送对象UID"
                    :rules="[rules.required]"
                    hint="指定礼物赠送对象，为0时则为本项目作者。"
                    v-model="config.donateGiftTarget"
                  ></v-text-field>
                </v-col>

              </v-row>
              <v-subheader>自动充电设置（限定年费大会员）</v-subheader>
              <v-row>
                <v-col
                  cols="6"
                  sm="4"
                  md="4"
                >
                  <v-text-field
                    label="充电对象UID"
                    :rules="[rules.required]"
                    hint="指定充电对象。该值为0时则为本项目作者，用于维护网站的正常运行和服务器资源开销，感谢您对本项目的支持。"
                    v-model="config.autoChargeTarget"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-subheader>任务日志推送设置</v-subheader>
              <v-row>
                <v-col
                  cols="6"
                  sm="6"
                  md="4"
                >
                  <v-select
                    :items="pushPriorities"
                    label="推送渠道"
                    item-text='name'
                    item-value='id'
                    hint="用于接收每日执行日志，强烈建议配置。便于通知您的数据过期。"
                    v-model="pushChannel"
                  >
                  </v-select>
                </v-col>
              </v-row>
              <v-row>
                <v-col
                  cols="12"
                  sm="6"
                  md="6"
                  v-if="pushChannel === 0">
                  <v-text-field
                    label="Server酱SendKey"
                    hint="Server酱SendKey。详情请前往官网 https://sct.ftqq.com/"
                    :rules="[rules.required]"
                    v-model="config.pushConfig.scKey"
                  ></v-text-field>
                </v-col>

                <v-col
                  cols="12"
                  sm="6"
                  md="6"
                  v-if="pushChannel === 1">
                  <v-text-field
                    label="Telegram bot token"
                    hint="BotFather 分配的 Token"
                    :rules="[rules.required]"
                    v-model="config.pushConfig.tgBotToken"
                  ></v-text-field>
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                  v-if="pushChannel === 1">
                  <v-text-field
                    label="Telegram user ID"
                    hint="Telegram 用户的数字 ID"
                    :rules="[rules.required]"
                    v-model="config.pushConfig.tgBotChatId"
                  ></v-text-field>
                </v-col>

                <v-col
                  cols="12"
                  md="3"
                  v-if="pushChannel === 2">
                  <v-text-field
                    label="企业微信 Corp ID"
                    hint="企业微信 Corp ID"
                    :rules="[rules.required]"
                    v-model="config.pushConfig.corpId"
                  ></v-text-field>
                </v-col>
                <v-col
                  cols="12"
                  md="3"
                  v-if="pushChannel === 2">
                  <v-text-field
                    label="企业微信 Corp Secret"
                    hint="企业微信 Corp Secret"
                    :rules="[rules.required]"
                    v-model="config.pushConfig.corpSecret"
                  ></v-text-field>
                </v-col>
                <v-col
                  cols="12"
                  md="3"
                  v-if="pushChannel === 2">
                  <v-text-field
                    label="企业微信 Agent ID"
                    hint="企业微信 Agent ID"
                    :rules="[rules.required]"
                    v-model="config.pushConfig.agentId"
                  ></v-text-field>
                </v-col>
                <v-col
                  cols="12"
                  md="3"
                  v-if="pushChannel === 2">
                  <v-text-field
                    label="企业微信 Media ID"
                    hint="素材管理中的图片Media ID。在【管理工具】-【图片】中找到您需要的图片，右键获取图片链接，即可在链接中看到 media_id 参数的值。"
                    :rules="[rules.required]"
                    v-model="config.pushConfig.mediaId"
                  ></v-text-field>
                </v-col>

                <v-col
                  cols="12"
                  md="3"
                  v-if="pushChannel === 3">
                  <v-text-field
                    label="Device key"
                    hint="Bark App 分配的 Device key。只填写 device_key 即可，不需要其他内容。"
                    :rules="[rules.required]"
                    v-model="config.pushConfig.barkDeviceKey"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-subheader>其他设置</v-subheader>
              <v-checkbox v-model="config.followDeveloper" label="关注开发者账号"></v-checkbox>
            </v-container>
          </v-form>
        </v-card-text>

        <div style="flex: 1 1 auto;"></div>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="removeTaskDialogVisible"
      persistent
      max-width="290"
    >
      <v-card>
        <v-card-title class="text-h5">
          删除任务
        </v-card-title>
        <v-card-text>
          <v-icon left color="orange">mdi-alert</v-icon>
          确认删除任务？该操作不可逆
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text
            @click="removeTaskDialogVisible = false"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            text
            :loading="removeTaskLoading"
            @click="removeTask"
          >
            确认
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="snackbar"
      top
      app
      :timeout="3000"
    >
      {{ snackbarMsg }}
    </v-snackbar>
  </div>
</template>

<script>
import Card from '@/components/Card'
import { mapActions, mapState } from 'vuex'

export default {
  components: {
    Card
  },
  data () {
    return {
      pageInfo: {
        page: 1,
        size: 36
      },
      removeTaskDialogVisible: false,
      removeTaskLoading: false,
      createTaskLoading: false,
      snackbarMsg: '',
      snackbar: false,
      sessdata: null,
      dedeuserid: null,
      biliJct: null,
      overlay: false,
      valid: false,
      cookieDialogVisible: false,
      createTaskDialogVisible: false,
      rules: {
        required: value => value !== null || '必填',
        isNumber: value => /^\d+$/.test(value) || '必须为数字',
        donateCoinsRange: value => (value <= 5 && value >= 0) || '范围: [0, 5]',
        reserveCoins: value => (value <= 4000 && value >= 0) || '范围: [0, 4000]'
      },
      platforms: [
        {
          label: 'iOS',
          value: 'ios'
        },
        {
          label: '安卓',
          value: 'android'
        }
      ],
      coinAddPriorities: [
        {
          id: 0,
          name: '优先给热榜视频投币'
        },
        {
          id: 1,
          name: '优先给关注的UP主投币'
        }
      ],
      needPush: false,
      pushPriorities: [
        {
          id: -1,
          name: '无'
        },
        {
          id: 0,
          name: 'Server酱Turbo'
        },
        {
          id: 1,
          name: 'Telegram'
        },
        {
          id: 2,
          name: '企业微信（图文推送）'
        },
        {
          id: 3,
          name: 'Bark'
        }
      ],
      pushChannel: -1,
      config: {
        donateCoins: 5,
        reserveCoins: 50,
        autoCharge: false,
        donateGift: false,
        donateGiftTarget: 0,
        autoChargeTarget: 0,
        devicePlatform: 'ios',
        donateCoinStrategy: 0,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36',
        skipTask: false,
        pushConfig: {
          tgBotToken: null,
          tgBotChatId: null,
          scKey: null,
          corpId: null,
          corpSecret: null,
          agentId: null,
          mediaId: null,
          barkDeviceKey: null
        },
        followDeveloper: false
      }
    }
  },
  mounted () {
    this.listUsers(this.pageInfo)
  },
  methods: {
    ...mapActions(['listUsers']),
    createTask () {
      const valid = this.$refs.createTaskForm.validate()
      if (valid) {
        this.createTaskLoading = true
        this.axios.post('/configs/task', this.config).then(res => {
          this.snackbarMsg = '😃 创建成功'
          this.snackbar = true
          this.createTaskDialogVisible = false
          this.user.configId = res.data.id
          this.listUsers({
            page: 1,
            size: 36
          })
        }).finally(() => {
          this.createTaskLoading = false
        })
      }
    },
    resetTaskConfig () {
      this.config = this.$options.data().config
    },
    removeTask () {
      this.removeTaskLoading = true
      this.axios.delete(`/configs/task?dedeuserid=${this.$cookies.get('dedeuserid')}`).then(res => {
        this.snackbarMsg = '😃 删除成功'
        this.user.biliTaskConfigId = null
        this.snackbar = true
        this.listUsers({
          page: 1,
          size: 36
        })
      }).finally(() => {
        this.removeTaskDialogVisible = false
        this.removeTaskLoading = false
      })
    }
  },
  watch: {
    createTaskDialogVisible: function (newVal, oldVal) {
      if (!newVal) {
        this.resetTaskConfig()
        this.$refs.createTaskForm.resetValidation()
      }
    },
    pushChannel: function (newVal, oldVal) {
      if (newVal === -1) {
        this.config.pushConfig = null
      }
      this.$refs.createTaskForm.resetValidation()
    },
    'pageInfo.page': function (newVal, oldVal) {
      this.listUsers(this.pageInfo)
    }
  },
  computed: {
    ...mapState(['user', 'users', 'screenLoading', 'cols'])
  }
}
</script>

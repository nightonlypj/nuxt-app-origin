const activeUser = Object.freeze({
  code: 'code000000000000000000001',
  name: 'user1の氏名',
  image_url: {
    small: 'https://example.com/images/user/small_noimage.jpg',
    xlarge: 'https://example.com/images/user/xlarge_noimage.jpg'
  }
})
const destroyUser = Object.freeze({
  ...activeUser,
  destroy_requested_at: '2000-01-01T12:34:56+09:00',
  destroy_schedule_at: '2000-01-08T12:34:56+09:00'
})

export {
  activeUser,
  destroyUser
}

// 権限のアイコンを返却
const memberPowerIcon = computed(() => (power: string) => {
  const $config = useRuntimeConfig()
  return ($config.public.member.powerIcon as any)[power] || $config.public.member.powerIcon.default
})

// 対象の権限かを返却
const currentMemberAdmin = computed(() => (space: any) => space?.current_member?.power === 'admin')
const currentMemberWriter = computed(() => (space: any) => space?.current_member?.power === 'writer')
const currentMemberReader = computed(() => (space: any) => space?.current_member?.power === 'reader')

// 対象の権限以上かを返却
const currentMemberWriterUp = computed(() => (space: any) => ['admin', 'writer'].includes(space?.current_member?.power))
const currentMemberReaderUp = computed(() => (space: any) => ['admin', 'writer', 'reader'].includes(space?.current_member?.power))

export {
  memberPowerIcon,
  currentMemberAdmin,
  currentMemberWriter,
  currentMemberReader,
  currentMemberWriterUp,
  currentMemberReaderUp
}

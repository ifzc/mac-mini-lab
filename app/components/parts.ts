export const parts = [
  {
    id: 'enclosure',
    name: '铝金属外壳',
    en: 'Aluminum enclosure',
    category: '机身结构',
    color: '#929ca5',
    title: '把一台电脑，收进掌心。',
    description:
      '圆角方形的铝金属机身包裹内部组件，提供结构支撑与外部保护。2024 款 Mac mini 的宽、深均为 12.7 厘米，高度为 5 厘米。',
    detail:
      '转到背面，可以观察电源、以太网、HDMI 和三个雷雳接口；前面则是两个 USB-C 接口与耳机插孔。',
    facts: [
      ['机身尺寸', '12.7 × 12.7 × 5 cm'],
      ['机身材质', '铝金属'],
    ],
    note: '外壳在这里整体向上移开，方便观察。实际维修需要从底部开始。',
  },
  {
    id: 'power',
    name: '内置电源',
    en: 'Power supply',
    category: '电力系统',
    color: '#ca994d',
    title: '电源，也在机身里面。',
    description:
      '内置电源把交流输入转换为内部组件所需的直流电，再通过电源管理电路为芯片、存储与接口供电。桌面上只需要一根电源线。',
    detail:
      '模型用线圈、电容与电源板示意电力转换部分。它和主板彼此配合，让不同负载下的用电保持稳定。',
    facts: [
      ['主要作用', '电力转换'],
      ['连接方式', '内置供电'],
    ],
    note: '元件位置经过简化；本页用于认识结构，不作为带电拆修指南。',
  },
  {
    id: 'logic',
    name: '主板与 M4 芯片',
    en: 'Logic board & Apple M4',
    category: '计算核心',
    color: '#438578',
    title: '小小芯片，连接整个系统。',
    description:
      'M4 将 CPU、GPU 等计算单元集成在一颗芯片中。统一内存让不同计算单元访问同一内存池，减少数据在独立内存之间来回复制。',
    detail:
      '主板把芯片、存储、供电和各个接口连接起来。本模型展示 M4 基础款：10 核 CPU、10 核 GPU。',
    facts: [
      ['CPU / GPU', '10 核 / 10 核'],
      ['内存架构', '统一内存'],
    ],
    note: '为了看清关系，芯片、内存与电路走线采用示意布局。',
  },
  {
    id: 'storage',
    name: 'SSD 存储模块',
    en: 'Solid-state storage',
    category: '数据存储',
    color: '#687dad',
    title: '你的文件，长久留在这里。',
    description:
      'SSD 使用闪存保存系统、应用与个人文件。它和运行时使用的统一内存不同：关闭电源后，存储中的数据仍会保留。',
    detail:
      '拆解视图将存储模块移到主板旁边，帮助区分存储与内存。这不意味着它是通用的 M.2 SSD，也不代表可以任意替换。',
    facts: [
      ['存储介质', 'NAND 闪存'],
      ['断电后', '保留数据'],
    ],
    note: '模块外形与连接位置为教学示意，不代表升级兼容性。',
  },
  {
    id: 'thermal',
    name: '风扇与散热器',
    en: 'Thermal system',
    category: '散热系统',
    color: '#8d7a64',
    title: '给性能，留一条风的路。',
    description:
      '散热器把芯片产生的热量传递到更大的表面，风扇推动空气流经散热鳍片，再将热量带出机身。两者共同维持稳定的工作温度。',
    detail:
      '可以旋转模型观察离心风扇的叶片、导风结构和金属鳍片。小机身内部的空间分配，也需要为气流留出通道。',
    facts: [
      ['散热方式', '主动风冷'],
      ['关键组件', '离心风扇 + 鳍片'],
    ],
    note: '风扇与散热器合并为一个讲解层，气流路径与尺寸经过简化。',
  },
  {
    id: 'base',
    name: '底盖与通风结构',
    en: 'Base & ventilation',
    category: '支撑与气流',
    color: '#565d69',
    title: '从底部，理解整台机器。',
    description:
      '底部结构承托机身，并为散热系统提供通风空间。脚垫让机身与桌面保持一定距离；2024 款的电源按钮也位于底部。',
    detail:
      '真实拆解通常从底盖开始。本页按从外到内的认识顺序展开各层，便于理解功能，并非逐步维修操作。',
    facts: [
      ['主要作用', '支撑与通风'],
      ['电源按钮', '机身底部'],
    ],
    note: '请保持通风空间。模型省略了部分螺丝、排线与屏蔽件。',
  },
] as const;
export type PartId = (typeof parts)[number]['id'];
export type ViewMode = 'perspective' | 'front' | 'back' | 'top';

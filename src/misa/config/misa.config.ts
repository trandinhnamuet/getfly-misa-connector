export const MISA_CONFIG = {
  app_id: 'f0c16081-957c-4bd5-ae34-83e4548e0fd4',
  access_code: 'LQcDsPYM/WsX9BgsPSoYvBcPYcDT55QGnHXretpttKNnwZ3Cbj/NYRpfL6LxZTpkAbCLkoFaaZJlKDCIBqXWMvML9W71KvtI4O384PCg+6mWjvT90j9cgdIgp/DBBHcyopbL3hwWNQYKGhJV/MHrD+bGKiBebfWhbLF/VisfSgkGjhop1SYUlcwLXkk/eKHr1578u0E3UvQNng6pjLRahclALTgfQkyX8D6zvriH7RNwEI9LeretGqu8Xv2DvEZywerXmeI6anE+mt69qYmvFg==',
  org_company_code: 'actapp',
  default_branch_id: 'f5e41242-bbc2-4d64-931d-4996ba1b4857',
  default_inventory_item_id: 'eee68bb7-8e2d-4563-9ef7-c747a7439516',
  default_unit_id: '71112249-98ce-4334-a06d-34736155fa35',
  default_stock_id: '7a96bdf4-de82-42f4-92da-91fcca2b5685'
};

export const MISA_ENDPOINTS = {
  connect: 'https://actapp.misa.vn/api/oauth/actopen/connect',
  getDictionary: 'https://actapp.misa.vn/apir/sync/actopen/get_dictionary',
  save: 'https://actapp.misa.vn/apir/sync/actopen/save'
};

export const DATA_FILES = {
  token: './data/misa_token.txt',
  branches: './data/misa_branches.txt',
  customers: './data/misa_customers.txt'
};
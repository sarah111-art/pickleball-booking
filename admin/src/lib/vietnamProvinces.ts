export interface District {
  code: string;
  name: string;
  wards: Ward[];
}

export interface Ward {
  code: string;
  name: string;
}

export interface Province {
  code: string;
  name: string;
  districts: District[];
}

export const vietnamProvinces: Province[] = [
  {
    code: "01",
    name: "Thành phố Hà Nội",
    districts: [
      {
        code: "0101",
        name: "Quận Ba Đình",
        wards: [
          { code: "010101", name: "Phường Phúc Tân" },
          { code: "010102", name: "Phường Cửa Nam" },
          { code: "010103", name: "Phường Liễu Giai" },
          { code: "010104", name: "Phường Nguyễn Du" },
        ]
      },
      {
        code: "0102",
        name: "Quận Hoàn Kiếm",
        wards: [
          { code: "010201", name: "Phường Hàng Bông" },
          { code: "010202", name: "Phường Hàng Buồm" },
          { code: "010203", name: "Phường Hàng Gai" },
          { code: "010204", name: "Phường Hoan Kiếm" },
        ]
      },
      {
        code: "0103",
        name: "Quận Tây Hồ",
        wards: [
          { code: "010301", name: "Phường Quảng An" },
          { code: "010302", name: "Phường Tây Hồ" },
          { code: "010303", name: "Phường Nhật Tân" },
        ]
      },
    ]
  },
  {
    code: "02",
    name: "Thành phố Hồ Chí Minh",
    districts: [
      {
        code: "0201",
        name: "Quận 1",
        wards: [
          { code: "020101", name: "Phường Bến Nghé" },
          { code: "020102", name: "Phường Đa Kao" },
          { code: "020103", name: "Phường Nguyễn Huệ" },
        ]
      },
      {
        code: "0202",
        name: "Quận 2",
        wards: [
          { code: "020201", name: "Phường An Khánh" },
          { code: "020202", name: "Phường An Lợi Đông" },
          { code: "020203", name: "Phường Bình An" },
        ]
      },
      {
        code: "0203",
        name: "Quận 3",
        wards: [
          { code: "020301", name: "Phường 1" },
          { code: "020302", name: "Phường 2" },
          { code: "020303", name: "Phường 3" },
        ]
      },
    ]
  },
  {
    code: "03",
    name: "Tỉnh Hải Phòng",
    districts: [
      {
        code: "0301",
        name: "Quận Hồng Bàng",
        wards: [
          { code: "030101", name: "Phường Minh Khai" },
          { code: "030102", name: "Phường Hồng Bàng" },
        ]
      },
      {
        code: "0302",
        name: "Quận Ngô Quyền",
        wards: [
          { code: "030201", name: "Phường Bạch Đằng" },
          { code: "030202", name: "Phường Quán Toan" },
        ]
      },
    ]
  },
  {
    code: "04",
    name: "Tỉnh Đà Nẵng",
    districts: [
      {
        code: "0401",
        name: "Quận Hải Châu",
        wards: [
          { code: "040101", name: "Phường Thanh Bình" },
          { code: "040102", name: "Phường Hải Châu 1" },
        ]
      },
      {
        code: "0402",
        name: "Quận Sơn Trà",
        wards: [
          { code: "040201", name: "Phường Mỹ Khê" },
          { code: "040202", name: "Phường Nại Hiên Đông" },
        ]
      },
    ]
  },
  {
    code: "05",
    name: "Tỉnh Cần Thơ",
    districts: [
      {
        code: "0501",
        name: "Quận Ninh Kiều",
        wards: [
          { code: "050101", name: "Phường An Hòa" },
          { code: "050102", name: "Phường Cái Khế" },
        ]
      },
      {
        code: "0502",
        name: "Quận Bình Thủy",
        wards: [
          { code: "050201", name: "Phường Bình Thủy" },
          { code: "050202", name: "Phường Long Hưng" },
        ]
      },
    ]
  },
  {
    code: "06",
    name: "Tỉnh Bắc Ninh",
    districts: [
      {
        code: "0601",
        name: "Thành phố Bắc Ninh",
        wards: [
          { code: "060101", name: "Phường Võ Cường" },
          { code: "060102", name: "Phường Ninh Xá" },
        ]
      },
    ]
  },
  {
    code: "07",
    name: "Tỉnh Hải Dương",
    districts: [
      {
        code: "0701",
        name: "Thành phố Hải Dương",
        wards: [
          { code: "070101", name: "Phường Bình Hàng" },
          { code: "070102", name: "Phường Cộng Hòa" },
        ]
      },
    ]
  },
  {
    code: "08",
    name: "Tỉnh Hưng Yên",
    districts: [
      {
        code: "0801",
        name: "Thành phố Hưng Yên",
        wards: [
          { code: "080101", name: "Phường Trần Phú" },
          { code: "080102", name: "Phường Tây Mỗ" },
        ]
      },
    ]
  },
];

export const getDistrictsByProvince = (provinceCode: string): District[] => {
  const province = vietnamProvinces.find(p => p.code === provinceCode);
  return province?.districts || [];
};

export const getWardsByDistrict = (districtCode: string, provinceCode: string): Ward[] => {
  const province = vietnamProvinces.find(p => p.code === provinceCode);
  const district = province?.districts.find(d => d.code === districtCode);
  return district?.wards || [];
};

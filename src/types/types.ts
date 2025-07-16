export interface DBConfig {
    host: string;
    user: string,
    password: string,
    database: string
}

export interface createUserBodyData {
    userId: string;
    first_name: string;
    last_name?: string;
    email: string;
    password: string;
    phone?: number;
    altPhone?: number;
    state?: string;
    district?: string;
    town?: string;
    pinCode?: number;
    gender?: string;
}

export interface loginDataType {
    phoneOrEmail: string | number;
    password: string;
}

export interface createAdminDataType {
    first_name: string;
    last_name?: string;
    phone: number;
    email: string;
    password: string;
    hostel_name: string;
    state: string;
    district: string;
    town_name: string;
    pinCode: number;
    gender: string;
}

export interface createRoomTypes {
    price: number;
    locality: string;
    district: string;
    latitude: number | null;
    longitude: number | null;
    rating: number;
    availability_date: string;
    room_type: 'PRIVATE' | 'SHARED' | 'FAMILY';
    gender: 'MALE' | 'FEMALE' | 'UNISEX'
    bed_sit: 'YES' | 'NO';
    ac: 'YES' | 'NO';
    toilet: 'YES' | 'NO';
    bathroom: 'YES' | 'NO';
    fan: 'YES' | 'NO';
    kitchen: 'YES' | 'NO';
    table_chair: 'YES' | 'NO';
    almira: 'YES' | 'NO';
    water_supply: number;
    water_drink: 'NAL' | 'FILTERED';
    parking_space: 'NO' | 'TWO_WHEELER';
    wifi: 'YES' | 'NO';
    ellectricity_bill: 'YES' | 'NO';
    discription: string;
    rules: string;
}


export interface searchingRoomsTypes {
    location: string;
    price: number;
    room_type: string;
    gender: string;
    availability_date: string;
    latitude?: number;
    longitude?: number;

}
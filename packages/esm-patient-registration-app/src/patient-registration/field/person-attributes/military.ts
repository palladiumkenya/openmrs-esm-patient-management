const militaryData = {
  cadres: [
    { id: 1, name: 'Kenya Army' },
    { id: 2, name: 'Kenya Air Force' },
    { id: 3, name: 'Kenya Navy' },
  ],
  units: [
    // Brigade Headquarters
    { id: 1, name: '2 BDE HQS', cadreId: 1 },
    { id: 2, name: '4 BDE HQS', cadreId: 1 },
    { id: 3, name: '6 BDE HQS', cadreId: 1 },
    { id: 4, name: '8 BDE HQS', cadreId: 1 },
    { id: 5, name: '110 BDE HQS', cadreId: 1 },

    // Infantry Units
    { id: 7, name: '3 KR', cadreId: 1 },
    { id: 8, name: '5 KR', cadreId: 1 },
    { id: 9, name: '7 KR', cadreId: 1 },
    { id: 10, name: '9 KR', cadreId: 1 },
    { id: 11, name: '15 KR', cadreId: 1 },
    { id: 12, name: '17 KR', cadreId: 1 },
    { id: 13, name: '19 KR', cadreId: 1 },
    { id: 14, name: '21 KR', cadreId: 1 },

    // Mechanized Infantry Battalions
    { id: 15, name: '23 MIB', cadreId: 1 },
    { id: 16, name: '25 MIB', cadreId: 1 },
    { id: 17, name: '27 MIB', cadreId: 1 },
    { id: 18, name: '31 MIB', cadreId: 1 },
    { id: 19, name: '33 MIB', cadreId: 1 },
    { id: 20, name: '35 MIB', cadreId: 1 },

    // Special Units
    { id: 21, name: 'SOB FIELD WKSP', cadreId: 1 },
    { id: 22, name: '60 ASB', cadreId: 1 },
    { id: 23, name: '20 PARA BN', cadreId: 1 },
    { id: 24, name: '40 RBN', cadreId: 1 },
    { id: 25, name: 'SOTS', cadreId: 1 },

    // Armored Units
    { id: 26, name: 'ARMD BDE HQS', cadreId: 1 },
    { id: 27, name: '76 ARB', cadreId: 1 },
    { id: 28, name: '76 ARB WKSP', cadreId: 1 },
    { id: 29, name: '78 TK BN', cadreId: 1 },
    { id: 30, name: '78 TK BN WKSP', cadreId: 1 },
    { id: 31, name: '81 TK BN', cadreId: 1 },
    { id: 32, name: '81 TK BN WKSP', cadreId: 1 },
    { id: 33, name: '86 ARB', cadreId: 1 },
    { id: 34, name: '86 ARB WKSP', cadreId: 1 },

    // Artillery Units
    { id: 35, name: 'ARTY BDE HQS', cadreId: 1 },
    { id: 36, name: '66 ARTY BN', cadreId: 1 },
    { id: 37, name: '66 ARTY BN WKSP', cadreId: 1 },
    { id: 38, name: '75 ARTY BN', cadreId: 1 },
    { id: 39, name: '75 ARTY BN WKSP', cadreId: 1 },
    { id: 40, name: '77 ARTY BN', cadreId: 1 },
    { id: 41, name: '77 ARTY BN WKSP', cadreId: 1 },
    { id: 42, name: '55 ARTY BN', cadreId: 1 },
    { id: 43, name: '88 ARTY BN', cadreId: 1 },

    // Engineer Units
    { id: 44, name: 'COMBAT ENGR BDE', cadreId: 1 },
    { id: 45, name: '10 ENGR BN', cadreId: 1 },
    { id: 46, name: '10 ENGR LAD', cadreId: 1 },
    { id: 47, name: '12 ENGR BN', cadreId: 1 },
    { id: 48, name: '12 ENGR LAD', cadreId: 1 },
    { id: 49, name: '14 ENGR BN', cadreId: 1 },

    // Construction Units
    { id: 50, name: 'ENGR CONSTR BDE', cadreId: 1 },
    { id: 51, name: '18 CONSTR ENGR BN', cadreId: 1 },

    // Workshop and Maintenance Units
    { id: 52, name: 'KACEME HQS', cadreId: 1 },
    { id: 53, name: 'WKSP BN', cadreId: 1 },
    { id: 54, name: '22 FLD WKSP', cadreId: 1 },
    { id: 55, name: '42 FLD WKSP', cadreId: 1 },
    { id: 56, name: '62 FLD WKSP', cadreId: 1 },
    { id: 57, name: '82 FLD WKSP', cadreId: 1 },

    // Supply and Ordnance Units
    { id: 58, name: 'DEFOD', cadreId: 1 },
    { id: 59, name: '2ND ORD BN', cadreId: 1 },
    { id: 60, name: 'AMMO SUPPLY BN', cadreId: 1 },
    { id: 61, name: '23 OCC', cadreId: 1 },
    { id: 62, name: '43 OCC', cadreId: 1 },
    { id: 63, name: '63 OCC', cadreId: 1 },
    { id: 64, name: '83 OCC', cadreId: 1 },

    // Transport Units
    { id: 65, name: 'KACT HQS', cadreId: 1 },
    { id: 66, name: 'TPT BN', cadreId: 1 },
    { id: 67, name: 'H/LIFT BN', cadreId: 1 },

    // Signal Units
    { id: 68, name: 'KACS HQS', cadreId: 1 },
    { id: 69, name: 'AHQ SIG BN', cadreId: 1 },
    { id: 70, name: 'AHQ SIG BN LAD', cadreId: 1 },

    // Medical Units
    { id: 71, name: 'KAMC HQS', cadreId: 1 },
    { id: 72, name: 'NRB LEV IV HOSP', cadreId: 1 },
    { id: 73, name: 'LANET LEV IV HOSP', cadreId: 1 },
    { id: 74, name: 'ISIOLO LEV IV HOSP', cadreId: 1 },
    { id: 75, name: 'ELD LEV IV HOSP', cadreId: 1 },
    { id: 76, name: '1ST MED BN', cadreId: 1 },
    { id: 77, name: '2ND MED BN', cadreId: 1 },

    // Military Police Units
    { id: 78, name: 'MPC HQS', cadreId: 1 },
    { id: 79, name: '1 MP BN', cadreId: 1 },
    { id: 80, name: '2 MP BN', cadreId: 1 },
    { id: 81, name: 'MPSIU', cadreId: 1 },
    { id: 82, name: 'PPU', cadreId: 1 },

    // Training Units
    { id: 83, name: 'KACA', cadreId: 1 },
    { id: 84, name: 'KMA', cadreId: 1 },
    { id: 85, name: 'RTS', cadreId: 1 },
    { id: 86, name: 'SOI', cadreId: 1 },

    // Headquarters and Command Units
    { id: 87, name: 'HQ KA', cadreId: 1 },
    { id: 88, name: 'BORDER SEC COMD', cadreId: 1 },
    { id: 89, name: 'KOFC HQS', cadreId: 1 },
    { id: 90, name: 'NDC', cadreId: 1 },
    { id: 91, name: 'IPSTC', cadreId: 1 },
    { id: 92, name: 'JWC', cadreId: 1 },
  ],
};

export default militaryData;

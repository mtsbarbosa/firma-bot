const cities = {
    "Diadema": ["diadema"],
    "Mauá": ["maua", "mauá"],
    "Santo André": ["sa", "santo andré", "santoandré", "santoandre", "santo andre"],
    "São Bernardo": ["sbc", "sao bernardo", "são bernardo", "saobernardo", "sãobernardo", "sao bernardo do campo", "são bernardo do campo"],
    "São Caetano": ["scs", "sao caetano", "sao caetano do sul", "saocaetano", "são caetano", "são caetano do sul"],
    "Ribeirão Pires": ["ribeirão pires", "ribeirao pires", "ribeirao", "rp", "ribeirão", "ribeiraopires", "ribeirãopires"],
    "Rio Grande da Serra": ["rgs", "rio grande da serra", "rio grande", "riogrande", "riograndedaserra"],
    "Outra": ["outra","outro"]
}

const findCity = (input) => {
    input = input? input.toLowerCase() : '';
    for (const [city, aliases] of Object.entries(cities)) {
        for (const alias of aliases) {
            if (alias.toLowerCase() === input) {
                return city;
            }
        }
    }
    return null;
}

module.exports = {
    cities,
    findCity
}
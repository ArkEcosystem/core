// new wallets to be used for each double spend combination
const wallets = {
    delegateRegistration: [
        {
            passphrase: "elephant kitchen matter caution subject early kiss van dress furnace hawk nerve",
            address: "AWe4ybyavswkLizXn8Rxf3ysUeHET6VNTv",
        },
        {
            passphrase: "useful dune final word level curve test grant vote you warrior ranch",
            address: "APmKYrtyyP34BdqQKyk71NbzQ2VKjG8sB3",
        },
        {
            passphrase: "wool snack hand excuse local ranch science fetch vocal labor loud excuse",
            address: "AdgQLnQ2YL1Kdqr5XA6EBomD5AETDgiNhE",
        },
        {
            passphrase: "gather educate element beyond swear until inflict trash change consider bachelor hazard",
            address: "AdbHjxqFGSXXVuwFNB8cCPWRDkhanRNwKg",
        },
        {
            passphrase: "empty useful twice lens priority very scheme total empower once magic muffin",
            address: "AUQ2AL2hDaqBznFqBTh8oJBHAFYqWfXP1k",
        },
    ],
    transfer: [
        {
            passphrase: "reform syrup saddle amazing stove merge lounge fun order inject hill surprise",
            address: "AJTycDZhvjcXCtJPAmXqQXhFfVRkeBSqxz",
        },
        {
            passphrase: "version pair float become omit rich roof unaware bitter jewel now avocado",
            address: "AL8ihupYtLL1CwoB4chkSRtWASsPnNporh",
        },
        {
            passphrase: "race fantasy word veteran bottom typical lake genre theory galaxy awful echo",
            address: "AKsmiCVjqcuJmeXdcjoGL2y4dtTY4eGW65",
        },
        {
            passphrase: "bulb priority open olive fresh tomorrow rack inject faith circle come certain",
            address: "ASFwzvpWwKYh1qtU3wrBvhd7CauZK5m1jN",
        },
        {
            passphrase: "lunch salmon vendor chase artist betray kid wild daring climb mention simple",
            address: "AdxAGPGEJ5ebtWCvdJxdrXxyUY6JgiPiG3",
        },
    ],
    secondSignRegistration: [
        {
            passphrase: "elder journey exercise tip dismiss undo find venture honey pitch planet video",
            address: "Ad6U7AN8ukCkgYvS5CUsHX9pZE1Eb7aLVC",
        },
        {
            passphrase: "present sunny spice ladder demise purpose avoid just trust gate arrow awake",
            address: "AJ78XN2n6QHEE7QSJrmq6SmokezARrRSNZ",
        },
        {
            passphrase: "gorilla pupil force extend file true expire diamond satisfy kangaroo quote reason",
            address: "AJLVeXcG917YNtibWXGWaqepmcvcZemCLq",
        },
        {
            passphrase: "same great since near decline sadness combine fruit foam awesome road life",
            address: "AT1pbzaJ7Paz4HtbmnsjyuJUCSTsvcNmJA",
        },
        {
            passphrase: "swift energy make brisk army useful athlete minute aerobic example renew bonus",
            address: "AX8T7DhdKCN5SHa7s8YpXeq42WybiT8hwk",
        },
    ],
    vote: [
        {
            passphrase: "hill mixed visit treat kiss dish noise blast drop rough depth outdoor",
            address: "Ac5WU4RCnbAduZdSj2XUm8hy9JX9obURqh",
        },
        {
            passphrase: "install account neglect such rocket river cherry zebra trick beauty cage drift",
            address: "AQERBVEP1sgAeb668ZDPV9f2pGZeTJY75r",
        },
        {
            passphrase: "buddy desk calm retreat run source crucial crane rescue twice panel spread",
            address: "AWJS93cofaa2LUz6MbGNXEU6dP9Fj1s9Pc",
        },
        {
            passphrase: "figure grain maximum trouble bring attitude dry swim pact race fever any",
            address: "AYQMGdESZ3Y4eg6Y1bYsr7kRviHUpK8abR",
        },
        {
            passphrase: "shiver yellow brick excess bike despair hero wheat number soccer brush crazy",
            address: "AZTrdvGCCcVpJkGZgvCUJkfnuZCpsXtQ9d",
        },
    ],
};

const arktoshi = 10 ** 8;

const fees = {
    transfer: 0.1 * arktoshi,
    vote: 1 * arktoshi,
    secondSignRegistration: 5 * arktoshi,
    delegateRegistration: 25 * arktoshi,
};

module.exports = {
    wallets,
    fees,
};

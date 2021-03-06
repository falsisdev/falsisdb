////////////////////////////////////////// JSON DATABASE //////////////////////////////////////////
const fs = require("fs"); //for file system
const Backup = require("./JSONBackup.js") //for backupping
////////////////////////////////////////// NECCESSARY FUNCTIONS //////////////////////////////////////////
const writeFileWithDirs = ((data, path) => {
    const dirs = path.split("/").slice(1, -1);

    if (dirs.length === 0) {
        fs.writeFileSync(path, data, "utf-8");
    } else {
        const dirsLength = dirs.length;
        const processedDirs = [];
        let i = 0;

        while (i < dirsLength) {
            processedDirs.push(dirs[i]);
            const currentPath = `./${processedDirs.join("/")}`;

            if (!fs.existsSync(currentPath) || !fs.lstatSync(currentPath).isDirectory()) {
                fs.mkdirSync(currentPath);
            }

            i++;
        }

        fs.writeFileSync(path, data, "utf-8");
    }
}); //for json writing with dirs
////////////////////////////////////////// NECCESSARY FUNCTIONS //////////////////////////////////////////
////////////////////////////////////////// DEPENDENCIES //////////////////////////////////////////
const EventEmitter = require("events")
////////////////////////////////////////// DEPENDENCIES   //////////////////////////////////////////
////////////////////////////////////////// DATABASE CLASS //////////////////////////////////////////
class JSONDatabase extends EventEmitter {
    ////////////////////////////////////////// CONSTRUCTOR //////////////////////////////////////////
    constructor(construct) {
        super();
        this.data = {};
        this.lastData = null;
        this.lastDataType = null;
        this.jsonFilePath = construct.filePath || "./falsisdb/database.json"
        this.eventData = {}
        this.eventData.check = null;
        this.eventData.willBeExecutedDatas = [];
        this.eventData.deleteEventCheck = null;
        this.eventData.willBeExecutedDeleteDatas = [];
        this.eventData.backupCheck = null;
        this.eventData.willBeExecutedBackupDatas = [];
        let file = this.jsonFilePath.split(".")
        if (file[file.length - 1] != "json") {
            throw Error("??? FalsisDB Hatas??: Girilen veri taban?? dosyas??n??n uzant??s?? json de??il")
        }
        setInterval(() => {
            if (this.eventData.check != null) {
                for (const data of this.eventData.willBeExecutedDatas) {
                    this.emit('dataSet', data)
                }
                this.eventData.check = null
                this.eventData.willBeExecutedDatas = []
            }
            if (this.eventData.deleteEventCheck != null) {
                for (const data of this.eventData.willBeExecutedDeleteDatas) {
                    this.emit('dataDelete', data)
                }
                this.eventData.deleteEventCheck = null
                this.eventData.willBeExecutedDeleteDatas = []
            }

            if (this.eventData.backupCheck != null) {
                for (const data of this.eventData.willBeExecutedBackupDatas) {
                    this.emit('backup', data)
                }
                this.eventData.backupCheck = null
                this.eventData.willBeExecutedBackupDatas = []
            }
        }, construct.eventInterval || 100)
        let log;
        if (construct.backup) {
            if (construct.backup.logging == true) {
                log = true
            } else if (construct.backup.logging == false) {
                log = false
            } else {
                log = true
            }
        }
        if (!fs.existsSync(this.jsonFilePath) || !fs.lstatSync(this.jsonFilePath).isFile()) {
            writeFileWithDirs("{}", this.jsonFilePath);
        }
        if (construct.backup) {
            if (construct.backup && construct.backup.path) {
                let backupFile = construct.backup.path.split(".")
                if (backupFile[backupFile.length - 1] != "json") {
                    throw Error("??? FalsisDB Hatas??: Girilen veri taban?? dosyas??n??n uzant??s?? json de??il")
                }
            }
            this.backup = new Backup({
                path: construct.backup.path || "./falsisdb/backup.json",
                time: construct.backup.time || 5,
                logging: log
            })
            this.backup.on("backup", (data) => {
                this.eventData.backupCheck = data;
                this.eventData.willBeExecutedBackupDatas.push(data)
            })
            this.lastBackupData = {}
            this.lastBackupData.backupDB = this.backup.lastBackupData.backupDB
            this.getBackupData = () => {
                let res = {};
                Object.entries(JSON.parse(fs.readFileSync(this.backup.path, "utf-8"))).map(x => Object.entries(x[1].data)).forEach(x => {
                    x.forEach(u => {
                        res[u[0]] = u[1]
                    })

                })
                return res
            }
            /*function set(key,value) {
      console.log(key + "  " + value)
      this.lastBackupData.backupDB.data.lastData[key] = value 
        writeFileWithDirs(JSON.stringify(this.lastBackupData.backupDB.data, null, 2), this.lastBackupData.backupDB.jsonFilePath);
    }*/
            //console.log(set)
            // this.lastBackupData.backupDB.set = set
        }
        this.fetchDataFromFile()
    }
    ////////////////////////////////////////// CONSTRUCTOR //////////////////////////////////////////
    ////////////////////////////////////////// NECCESSARY FUNCTIONS //////////////////////////////////////////
    fetchDataFromFile() {
        let savedData;
        try {
            savedData = JSON.parse(fs.readFileSync(this.jsonFilePath, "utf-8"));
        } catch (error) {
            console.error(error)
        }

        this.data = savedData;
    }
    kaydet(key, value, type) {
        writeFileWithDirs(JSON.stringify(this.data, null, 2), this.jsonFilePath);
        if (this.backup && !(type == "clear" || type == "delete")) {
            this.backup.sendBackup(key, value)
        }
    }
    ////////////////////////////////////////// NECCESSARY FUNCTIONS //////////////////////////////////////////
    ////////////////////////////////////////// get() //////////////////////////////////////////
    get(key) {
        if (!key) {
            throw Error("??? FalsisDB Hatas??: Veri Taban??ndan ??ekilecek Veri Bulunamad??. L??tfen ??ekmek ??stedi??iniz Veriyi Girin.")
        } else {
            return this.data[key];
        }
    }
    ////////////////////////////////////////// get() //////////////////////////////////////////
    ////////////////////////////////////////// has() //////////////////////////////////////////
    has(key, returnDatas = false) {
        if (!key) throw Error("??? FalsisDB Hatas??: Veri Taban??nda Varl?????? Kontrol Edilecek Veri Bulunamad??. L??tfen ??artlanacak Veriyi Girin.")
        let result = Boolean(this.data[key]);
        if (returnDatas === true) {
            let data = Object.entries(JSON.parse(fs.readFileSync(this.jsonFilePath, "utf-8"))).filter(x => x[0] === key)
            let obj = {}
            result == true ? obj[data[0][0]] = data[0][1] : ""
            return {
                result: result,
                data: obj
            }
        } else {
            return result;
        }
    }
    ////////////////////////////////////////// has() //////////////////////////////////////////
    ////////////////////////////////////////// set() //////////////////////////////////////////
    set(key, value) {
        const old = this.data[key]
        if (!key) {
            throw Error("??? FalsisDB Hatas??: Veri Taban?? Dosyas??na Eklenecek Veri Bulunamad??. L??tfen Eklemek ??stedi??iniz Verinin ??smini Girin.")
        } else if (!value) {
            throw Error("??? FalsisDB Hatas??: Veri Taban?? Dosyas??na Eklenecek Veri Bulunamad??. L??tfen Eklemek ??stedi??iniz Verinin De??erini Girin.")
        } else {
            this.data[key] = value;
            this.kaydet(key, value, 'set');
            const data = {
                key: key,
                changed: old == undefined ? false : this.data[key] == old ? false : true,
                newAdded:old == undefined,
                oldValue: old,
                value: value
            }
            this.eventData.check = data
            this.eventData.willBeExecutedDatas.push(data)
        }
    }
    ////////////////////////////////////////// set() //////////////////////////////////////////
    ////////////////////////////////////////// delete() //////////////////////////////////////////
    delete(key) {
        const val = this.data[key]
        if (!key) {
            throw Error("??? FalsisDB Hatas??: Veri Taban?? Dosyas??nan Silinmek ??stenen Veri Bulunamad??. L??tfen Silinecek Veriyi Girin.")
        } else {
            delete this.data[key];
            this.kaydet(undefined, undefined, "delete");
            this.eventData.deleteEventCheck = {
                key: key,
                value: val
            }
            this.eventData.willBeExecutedDeleteDatas.push(this.eventData.deleteEventCheck)
        }
    }
    ////////////////////////////////////////// delete() //////////////////////////////////////////
    ////////////////////////////////////////// conc() //////////////////////////////////////////
    conc(key, count) {
        if (!key) {
            throw Error("??? FalsisDB Hatas??: Veri Taban??nda ??zerine Ekleme Yap??lmak ??stenen Veri Bulunamad??. L??tfen Ekleme Yapmak ??stedi??iniz Verinin ??smini Girin.")
        }
        if (!count) {
            throw Error("??? FalsisDB Hatas??: Verinin ??zerine Eklemek ??stedi??iniz De??er Bulunamad??. L??tfen Ekleme Yapmak ??stedi??iniz Verinin ??smini Girin.")
        }
        if (!this.data[key]) {
            //console.log(this.data)
            this.data[key] = count;
            this.kaydet(key, this.data[key])
            this.lastData = count;
            this.lastDataType = "conc"
            return;
        }
        if (typeof this.data[key] == 'string' && isNaN(parseInt(this.data[key])) == false) {
            const val = String(parseInt(this.data[key]) + parseInt(count));
            this.data[key] = val
            this.kaydet(key, this.data[key]);
        } else {
            this.data[key] += count;
            this.kaydet(key, this.data[key]);
        }


        this.lastData = count;
        this.lastDataType = "conc"
    }
    ////////////////////////////////////////// conc() //////////////////////////////////////////
    ////////////////////////////////////////// MATH FUNCTIONS //////////////////////////////////////////
    ////////////////////////////////////////// multi() //////////////////////////////////////////
    multi(key, count) {
        if (!key) {
            throw Error("??? FalsisDB Hatas??: Veri Taban??nda ??arpma ????lemine Sokulacak Veri Bulunamad??. L??tfen Verinin ??smini Girin.")
        }
        if (!count) {
            throw Error("??? FalsisDB Hatas??: Veri ile ??arpma ????lemine Sokmak ??stedi??iniz De??er Bulunamad??. L??tfen ????leme Sokmak ??stedi??iniz Verinin ??smini Girin.")
        }
        if (isNaN(parseInt(this.data[key])) == true) {
            throw Error("??? FalsisDB Hatas??: Veri ile ??arpma ????lemine Sokmak ??stedi??iniz De??er Bir Say?? Olmal??. L??tfen ????leme Sokmak ??stedi??iniz Veriyi Say?? Format??nda Girin.")
        }
        if (!this.data[key]) {
            this.data[key] = count;
            this.lastData = count;
            this.lastDataType = "multi"
            this.kaydet(key, this.data[key]);
            return;
        } else {
            const val = String(parseInt(this.data[key]) * parseInt(count));
            this.data[key] = val
        }
        this.lastData = count;
        this.lastDataType = "multi"
        this.kaydet(key, this.data[key]);
    }
    ////////////////////////////////////////// multi() //////////////////////////////////////////
    ////////////////////////////////////////// divide() //////////////////////////////////////////
    divide(key, count) {
        if (!key) {
            throw Error("??? FalsisDB Hatas??: Veri Taban??nda B??lme ????lemine Sokulacak Veri Bulunamad??. L??tfen Verinin ??smini Girin.")
        }
        if (!count) {
            throw Error("??? FalsisDB Hatas??: Veri ile B??lme ????lemine Sokmak ??stedi??iniz De??er Bulunamad??. L??tfen ????leme Sokmak ??stedi??iniz Verinin ??smini Girin.")
        }
        if (isNaN(parseInt(this.data[key])) == true) {
            throw Error("??? FalsisDB Hatas??: Veri ile B??lme ????lemine Sokmak ??stedi??iniz De??er Bir Say?? Olmal??. L??tfen ????leme Sokmak ??stedi??iniz Veriyi Say?? Format??nda Girin.")
        }
        if (!this.data[key]) {
            this.data[key] = count;
            this.lastData = count;
            this.lastDataType = "divide"
            this.kaydet(key, this.data[key]);
            return;
        } else {
            const val = String(parseInt(this.data[key]) / parseInt(count));
            this.data[key] = val
        }
        this.lastData = count;
        this.lastDataType = "divide"
        this.kaydet(key, this.data[key]);
    }
    ////////////////////////////////////////// divide() //////////////////////////////////////////
    ////////////////////////////////////////// sum() //////////////////////////////////////////
    sum(key, count) {
        if (!key) {
            throw Error("??? FalsisDB Hatas??: Veri Taban??nda Toplama ????lemine Sokulacak Veri Bulunamad??. L??tfen Verinin ??smini Girin.")
        }
        if (!count) {
            throw Error("??? FalsisDB Hatas??: Veri ile Toplama ????lemine Sokmak ??stedi??iniz De??er Bulunamad??. L??tfen ????leme Sokmak ??stedi??iniz Verinin ??smini Girin.")
        }
        if (isNaN(parseInt(this.data[key])) == true) {
            throw Error("??? FalsisDB Hatas??: Veri ile Toplama ????lemine Sokmak ??stedi??iniz De??er Bir Say?? Olmal??. L??tfen ????leme Sokmak ??stedi??iniz Veriyi Say?? Format??nda Girin.")
        }
        if (!this.data[key]) {
            this.data[key] = +count;
            this.lastData = count;
            this.lastDataType = "sum"
            this.kaydet(key, this.data[key]);
            return;
        } else {
            const val = String(parseInt(this.data[key]) + parseInt(count));
            this.data[key] = val
        }
        this.lastData = count;
        this.lastDataType = "sum"
        this.kaydet(key, this.data[key]);
    }
    ////////////////////////////////////////// sum() //////////////////////////////////////////
    ////////////////////////////////////////// sub() //////////////////////////////////////////
    sub(key, count) {
        if (!key) {
            throw Error("??? FalsisDB Hatas??: Veri Taban??nda ????karma ????lemine Sokulacak Veri Bulunamad??. L??tfen Verinin ??smini Girin.")
        }
        if (!count) {
            throw Error("??? FalsisDB Hatas??: Veri ile ????karma ????lemine Sokmak ??stedi??iniz De??er Bulunamad??. L??tfen ????leme Sokmak ??stedi??iniz Verinin ??smini Girin.")
        }
        if (isNaN(parseInt(this.data[key])) == true) {
            throw Error("??? FalsisDB Hatas??: Veri ile ????karma ????lemine Sokmak ??stedi??iniz De??er Bir Say?? Olmal??. L??tfen ????leme Sokmak ??stedi??iniz Veriyi Say?? Format??nda Girin.")
        }
        if (!this.data[key]) {
            this.data[key] = -count;
            this.lastData = count;
            this.lastDataType = "sub"
            this.kaydet(key, this.data[key])
            return;
        } else {
            const val = String(parseInt(this.data[key]) - parseInt(count));
            this.data[key] = val
        }
        this.lastData = count;
        this.lastDataType = "sub"
        this.kaydet(key, this.data[key]);
    }
    ////////////////////////////////////////// sub() //////////////////////////////////////////
    ////////////////////////////////////////// MATH FUNCTIONS //////////////////////////////////////////
    ////////////////////////////////////////// push() //////////////////////////////////////////
    push(key, element) {
        if (!key) {
            throw Error("??? FalsisDB Hatas??: Veri Taban??nda ??zerine De??er Eklemek ??stedi??iniz Array Bir Veri Bulunamad??. L??tfen Verinin ??smini Girin.")
        }
        if (!element) {
            throw Error("??? FalsisDB Hatas??: Verinin ??zerine Eklemek ??stedi??iniz De??er Bulunamad??. L??tfen Eklemek ??stedi??iniz De??erin ??smini Girin.")
        }
        if (!this.data[key]) {
            this.data[key] = [];
            this.lastData = element;
            this.lastDataType = "push"
            this.kaydet(key, this.data[key])
            return;
        }
        if (!Array.isArray(this.data[key])) {
            throw Error("??? FalsisDB Hatas??: Veri Taban??nda ??zerine De??er Eklemek ??stedi??iniz Veri Array De??il. L??tfen Veriyi Array Format??nda Olacak Bi??imde De??i??tirin.")
        } else {
            this.data[key].push(element)
            this.kaydet(key, this.data[key]);
            this.lastData = element;
            this.lastDataType = "push"
        }
    }
    ////////////////////////////////////////// push() //////////////////////////////////////////
    ////////////////////////////////////////// clear() //////////////////////////////////////////
    clear() {
        this.data = {};
        this.kaydet(undefined, undefined, "clear");
    }
    ////////////////////////////////////////// clear() //////////////////////////////////////////
    ////////////////////////////////////////// info() //////////////////////////////////////////
    get info() {
        return {
            name: "falsisdb",
            type: "JSONDatabase",
            version: "2.3.2",
            owner: "falsisdev",
            developers: ["falsisdev", "berat141"],
            github: "https://github.com/falsisdb/falsisdb",
            pathfile: this.jsonFilePath,
            backupfile: construct.backup.path,
            backuptime: construct.backup.time,
            lastdata: {
                data: this.lastData,
                type: this.lastDataType
            }
        }
    }
    ////////////////////////////////////////// info() //////////////////////////////////////////
    ////////////////////////////////////////// all() //////////////////////////////////////////
    all() {
        if (!this.jsonFilePath) {
            throw new TypeError("??? FalsisDB Hatas??: Veri Taban?? Dosyas?? Bulunamad??. L??tfen Geli??tiriciler ??le ??leti??ime Ge??in.")
        }
        return fs.readFileSync(`${this.jsonFilePath}`, "utf8")
    }
    includesKey(key, returnDatas = false) {
        if (!key) {
            throw new Error("??? FalsisDB Hatas??: Veri Taban??nda Varl?????? Kontrol Edilecek Veri Bulunamad??. L??tfen ??artlanacak Veriyi Girin.")
        } else {
            let data = Object.entries(JSON.parse(fs.readFileSync(this.jsonFilePath, "utf-8"))).filter(x => x[0].includes(key))
            if (returnDatas = false) {
                return data.length > 0 ? true : false
            } else {
                let obj = {};
                data.forEach(x => {
                    obj[x[0]] = x[1]
                })
                return {
                    result: data.length > 0 ? true : false,
                    data: obj
                }

            }
        }
    }
    ////////////////////////////////////////// all() //////////////////////////////////////////
    ////////////////////////////////////////// CHECKING EXISTENCE //////////////////////////////////////////
    includesValue(value, returnDatas = false) {
        if (!value) {
            throw new Error("??? FalsisDB Hatas??: Veri Taban??nda Varl?????? Kontrol Edilecek Veri De??eri Bulunamad??. L??tfen ??artlanacak Verinin De??erini Girin.")
        } else {
            let data = Object.entries(JSON.parse(fs.readFileSync(this.jsonFilePath, "utf-8"))).filter(x => x[1].includes(value))
            if (returnDatas = false) {
                return data.length > 0 ? true : false
            } else {
                let obj = {};
                data.forEach(x => {
                    obj[x[0]] = x[1]
                })
                return {
                    result: data.length > 0 ? true : false,
                    data: obj
                }

            }
        }
    }
    hasValue(value, returnDatas = false) {
        if (!value) {
            throw new Error("??? FalsisDB Hatas??: Veri Taban??nda Varl?????? Kontrol Edilecek Veri De??eri Bulunamad??. L??tfen ??artlanacak Verinin De??erini Girin.")
        }

        let data = Object.entries(JSON.parse(fs.readFileSync(this.jsonFilePath, "utf-8"))).filter(x => x[1] === value)

        if (returnDatas == false) {
            return data.length === 0 ? false : true
        } else {
            let obj = {}
            data.forEach(x => {
                obj[x[0]] = x[1]
            })
            return {
                result: data.length > 0 ? true : false,
                data: obj
            }
        }
    }
    ////////////////////////////////////////// CHECKING EXISTENCE //////////////////////////////////////////
    ////////////////////////////////////////// ALL (...) //////////////////////////////////////////
    keys() {
        return Object.entries(JSON.parse(fs.readFileSync(this.jsonFilePath, "utf-8"))).map(x => x[0])
    }

    values() {
        return Object.entries(JSON.parse(fs.readFileSync(this.jsonFilePath, "utf-8"))).map(x => x[1])
    }
    all() {
        this.fetchDataFromFile()
        return this.data
    }
    ////////////////////////////////////////// ALL (...) //////////////////////////////////////////
    ////////////////////////////////////////// find()  //////////////////////////////////////////
    find(fn) {
        this.fetchDataFromFile()
        let res = {};
        for (const [key, val] of Object.entries(this.data)) {
            if (fn(val, key, this.data)) {
                res[key] = val
                break;
            } else continue
        }
        return res
    }
    ////////////////////////////////////////// find()  //////////////////////////////////////////
    ////////////////////////////////////////// FILTERS  //////////////////////////////////////////
    filter(fn) {
        this.fetchDataFromFile()
        let res = {};
        for (const [key, val] of Object.entries(this.data)) {
            if (fn(val, key, this.data))
                res[key] = val
        }
        return res
    }
    filterKey(fn) {
        let res = {};
        for (const [key, val] of Object.entries(this.data)) {
            if (fn(key, val, this.data))
                res[key] = val
        }
        return res
    }

    findKey(fn) {
        let res = {};
        for (const [key, val] of Object.entries(this.data)) {
            if (fn(key, val, this.data)) {
                res[key] = val
                break;
            } else continue
        }
        return res
    }
    ////////////////////////////////////////// FILTERS  //////////////////////////////////////////
}
////////////////////////////////////////// MODULE EXPORTS  //////////////////////////////////////////
module.exports = JSONDatabase;
////////////////////////////////////////// MODULE EXPORTS  //////////////////////////////////////////


module.exports = class Utils {

    static objFlip(objIn) {
        return Object.entries(objIn).reduce((obj, [key, value]) => ({ ...obj, [value]: key }), {});
    }

    //positive modulo
    static mod(n, m) {
        return ((n % m) + m) % m;
    }

    static inverseMatrix(m) {
        return m[0].map((x,i) => m.map(x => x[i]))
    }

    static transposeValue(a,b,c,d,e) {//value,min from, max from, min to, max to
        return ((a-b)/(c-b))*(e-d)+d;
    }

    static arraysEqual(a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length !== b.length) return false;
        for (var i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    static cloneArray(arr) {
        return arr.slice();
    }

    static getFormattedDate(timestamp) {
        let date = new Date(timestamp);
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let hour = date.getHours();
        let min = date.getMinutes();
        let sec = date.getSeconds();
        month = (month < 10 ? "0" : "") + month;
        day = (day < 10 ? "0" : "") + day;
        hour = (hour < 10 ? "0" : "") + hour;
        min = (min < 10 ? "0" : "") + min;
        sec = (sec < 10 ? "0" : "") + sec;
        let str = date.getFullYear() + "-" + month + "-" + day + "_" +  hour + "-" + min + "-" + sec;
        return str;
    }
}
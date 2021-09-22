
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
}
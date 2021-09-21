
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
}
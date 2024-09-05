
export const checkEmail=function(email){
    let reg=/^[a-zA-Z0-9]+@[a-z]+\.[a-z]+$/
    return reg.test(email)
}
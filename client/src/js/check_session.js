export const checkSession = () => {
    let userSession = JSON.parse (localStorage.getItem('user_session'));
    if (userSession){
        const now = new Date().getTime();
        if (now > userSession.expiry){
            localStorage.removeItem("user_session");
            window.location.href = "./signup.htm";
        }else{
            console.log ("Phiên còn hợp lệ");
        }
    }else{
        window.location.href = "./signup.htm";
    }
}
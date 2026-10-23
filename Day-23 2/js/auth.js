(() => {
  const USERS = [
    {email:"admin@demo.com",password:"Admin123!",name:"vanza swayam",role:"Admin"},
    {email:"staff@demo.com",password:"Staff123!",name:"jayraj patel",role:"Staff"}
  ];
  const SESSION = "day23_stockly_session";
  window.Auth = {
    current() { try { return JSON.parse(sessionStorage.getItem(SESSION) || "null"); } catch { return null; } },
    login(email,password) {
      const user=USERS.find(u=>u.email.toLowerCase()===email.trim().toLowerCase() && u.password===password);
      if(!user) return false;
      sessionStorage.setItem(SESSION,JSON.stringify({email:user.email,name:user.name,role:user.role}));
      return true;
    },
    logout() { sessionStorage.removeItem(SESSION); location.href="login.html"; },
    allowed(page) {
      const user=this.current();
      if(!user) return false;
      if(user.role==="Admin") return true;
      return ["dashboard","products","stock","sales"].includes(page);
    },
    guardLoginPage() { if(this.current()) location.replace("index.html"); }
  };
  if(document.getElementById("loginForm")) {
    Auth.guardLoginPage();
    const form=document.getElementById("loginForm");
    const message=document.getElementById("loginMessage");
    form.addEventListener("submit",e=>{
      e.preventDefault();
      const ok=Auth.login(document.getElementById("loginEmail").value,document.getElementById("loginPassword").value);
      if(ok) location.href="index.html";
      else { message.textContent="Email or password is incorrect. Please try again."; message.className="form-message error-text"; }
    });
    document.getElementById("togglePassword").addEventListener("click",()=>{
      const input=document.getElementById("loginPassword");
      input.type=input.type==="password"?"text":"password";
      document.getElementById("togglePassword").textContent=input.type==="password"?"Show":"Hide";
    });
    document.getElementById("fillAdmin").addEventListener("click",()=>{
      document.getElementById("loginEmail").value="admin@demo.com";
      document.getElementById("loginPassword").value="Admin123!";
    });
  }
})();
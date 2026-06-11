import { useState } from "react";

interface LoginProps
{
	isOpen: boolean;
	onClose: () => void;
}

export function Login({isOpen, onClose}: LoginProps)
{
	const [isRegister, setIsRegister] = useState(false);

	if (!isOpen)
		return null;

	return (
		<div className="login-overlay">
			<div className="login-content">
				<button onClick={onClose} style={{position: "absolute", background: "transparent", border: "none", fontSize: "18px", cursor: "pointer", right:"15px", top:"20px"}}>
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" >
    			<line x1="6" y1="6" x2="18" y2="18" />
   				<line x1="18" y1="6" x2="6" y2="18" />
				</svg>
				</button>
				<h2 style={{textAlign: "left"}}>{isRegister ? "Créer un compte" : "Bon retour"}</h2>
				<p style={{textAlign: "left", fontSize: "13px", marginTop:"-10px", marginBottom:"10px"}}>{isRegister ? "Créez un compte pour jouer en ligne" : "Connectez-vous pour jouer en ligne"}</p>

				{isRegister && (
					<>
					<strong style={{textAlign: "left", fontSize: "13px", color: "black", marginBottom: "-13px", marginTop: "-13px"}}>Pseudo</strong>
					<input type="text" placeholder="JonDoe" style={{borderRadius: "10px", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "10px", marginBottom:"20px", border: "1px solid white", boxShadow: "2px 2px 5px 3px rgba(0, 0, 0, 0.15)", outline: "none"}}/>
					</>
				)}

				<strong style={{textAlign: "left", fontSize: "13px", color: "black", marginBottom: "-13px", marginTop: "-13px"}}>Email</strong>
				<input type="text" placeholder="vous@exemple.com" style={{borderRadius: "10px", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "10px", border: "1px solid white", boxShadow: "2px 2px 5px 3px rgba(0, 0, 0, 0.15)", outline: "none"}}/>

				<strong style={{textAlign: "left", fontSize: "13px", color: "black", marginBottom: "-13px", marginTop: "10px"}}>Mot de passe</strong>
				<input type="password" placeholder="••••••••" style={{borderRadius: "10px", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "10px", border: "1px solid white", boxShadow: "2px 2px 5px 3px rgba(0, 0, 0, 0.15)", outline: "none"}}/>

				<button onClick={onClose} style={{marginTop:"20px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "10px",backgroundColor: "#f0d9b5", outline: "none", border: "1px solid #f0d9b5", boxShadow: "2px 2px 5px 3px rgba(0, 0, 0, 0.15)", cursor: "pointer"}}>
					Se connecter
				</button>
				<button onClick={() => setIsRegister(!isRegister)} style={{border:"none", backgroundColor:"White", marginTop:"10px", cursor: "pointer"}}>
					{isRegister ? "Déjà un compte ? Se connecter" : "Pas encore de compte ? S'inscrire"}
				</button>
			</div>
		</div>
	);
}
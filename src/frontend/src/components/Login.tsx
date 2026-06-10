interface LoginProps
{
	isOpen: boolean;
	onClose: () => void;
}

export function Login({isOpen, onClose}: LoginProps)
{
	if (!isOpen)
		return null;

	return (
		<div className="login-overlay">
			<div className="login-content">
				<button onClick={onClose} style={{textAlign: "right",background: "transparent", border: "none", fontSize: "18px", cursor: "pointer",}}>
				x
				</button>
				<h2 style={{textAlign: "left"}}>Bon retour</h2>
				<p style={{textAlign: "left", fontSize: "13px", marginTop:"-10px", marginBottom:"10px"}}>Connectez-vous pour jouer en ligne</p>

				<strong style={{textAlign: "left", fontSize: "13px", color: "black", marginBottom: "-13px", marginTop: "-13px"}}>Email</strong>
				<input type="text" placeholder="vous@exemple.com" style={{borderRadius: "10px", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "10px", border: "1px solid white", boxShadow: "2px 2px 5px 3px rgba(0, 0, 0, 0.15)", outline: "none"}}/>

				<strong style={{textAlign: "left", fontSize: "13px", color: "black", marginBottom: "-13px", marginTop: "10px"}}>Mot de passe</strong>
				<input type="password" placeholder="••••••••" style={{borderRadius: "10px", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "10px", border: "1px solid white", boxShadow: "2px 2px 5px 3px rgba(0, 0, 0, 0.15)", outline: "none"}}/>

				<button onClick={onClose} style={{marginTop:"20px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "10px",backgroundColor: "#f0d9b5", outline: "none", border: "1px solid #f0d9b5", boxShadow: "2px 2px 5px 3px rgba(0, 0, 0, 0.15)"}}>
					Se connecter
				</button>
			</div>
		</div>
	);
}
import React, { useState, useEffect } from "react";
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from "amazon-cognito-identity-js";

const poolData = {
  UserPoolId: "eu-north-1_TTx4JU3oe",
  ClientId: "1ur0nf3sb5inbf9v5kkv14l3vk",
};
const userPool = new CognitoUserPool(poolData);

const Spinner = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const AuthModal = ({ isOpen, closeModal, onSuccessfulLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [registeredUser, setRegisteredUser] = useState(null);

  const [usernameValid, setUsernameValid] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });
  const [emailValid, setEmailValid] = useState(false);

  useEffect(() => {
    const validatePassword = () => {
      const length = password.length >= 5;
      const uppercase = /[A-Z]/.test(password);
      const number = /\d/.test(password);
      const specialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      setPasswordValidation({ length, uppercase, number, specialChar });
    };
    validatePassword();
  }, [password]);

  useEffect(() => {
    const validateEmail = () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setEmailValid(emailRegex.test(email));
    };
    validateEmail();
  }, [email]);

  const checkUsernameAvailability = async () => {
    if (username.length < 3) {
      setUsernameValid(false);
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/check-username?username=${username}`);
      const data = await response.json();

      if (!response.ok || !data.available) {
        setUsernameValid(false);
        return;
      }
      setUsernameValid(true);
    } catch {
      setUsernameValid(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkUsernameAvailability();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [username]);

  const allRequirementsMet = () => {
    return (
      emailValid &&
      usernameValid &&
      Object.values(passwordValidation).every((valid) => valid)
    );
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    if (!allRequirementsMet()) return;

    setIsLoading(true);
    try {
      const attributeList = [{ Name: "email", Value: email }];
      userPool.signUp(email, password, attributeList, null, async (err, result) => {
        if (err) {
          setError(err.message || JSON.stringify(err));
          return;
        }

        setRegisteredUser(new CognitoUser({ Username: email, Pool: userPool }));
        setIsRegistering(false);
        setIsVerifying(true);

        await fetch("http://localhost:5000/api/create-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: result.userSub,
            email,
            username,
            credits: 1000,
          }),
        });
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userData = { Username: email, Pool: userPool };
      const user = new CognitoUser(userData);

      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      user.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          user.getUserAttributes((err, attributes) => {
            if (err) {
              console.error(err);
              return;
            }

            const fullUserObject = {
              username: user.getUsername(),
              attributes: attributes.reduce((acc, attr) => {
                acc[attr.getName()] = attr.getValue();
                return acc;
              }, {}),
            };

            if (onSuccessfulLogin) {
              onSuccessfulLogin(fullUserObject);
            }
            closeModal();
          });
        },
        onFailure: (err) => {
          setError(err.message || "Inloggning misslyckades.");
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!registeredUser) {
        throw new Error('Ingen användare att verifiera.');
      }
  
      registeredUser.confirmRegistration(verificationCode, true, (err, result) => {
        if (err) {
          setError(err.message || 'Verifiering misslyckades.');
          return;
        }
        console.log('Verifiering lyckades:', result);
        setIsVerifying(false);
  
        // Användaren loggas in automatiskt efter verifiering
        handleLogin(e); // Återanvänd handleLogin för att logga in användaren
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  

  const toggleAuthMode = () => {
    setIsRegistering(!isRegistering);
    setIsVerifying(false);
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoalGray/70">
      <div className="relative w-full max-w-md bg-warmWhite rounded-lg shadow-xl p-6">
        <h2 className="text-2xl font-semibold text-center mb-4 text-lavenderPurple">
          {isRegistering ? "Skapa konto" : isVerifying ? "Verifiera din e-post" : "Logga in"}
        </h2>
        {error && <p className="text-lightCoralPink mb-4">{error}</p>}
  
        {isLoading ? (
          <Spinner />
        ) : isRegistering ? (
          <form onSubmit={handleRegistration} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Användarnamn"
                required
                className="w-full p-2 border border-softGray rounded focus:outline-none focus:ring-2 focus:ring-turquoise"
              />
              <span
                className={`absolute right-2 top-2 text-xl ${
                  usernameValid ? "text-turquoise" : "text-lightCoralPink"
                }`}
              >
                ✔
              </span> 
            </div>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-post"
                required
                className="w-full p-2 border border-softGray rounded focus:outline-none focus:ring-2 focus:ring-turquoise"
              />
              <span
                className={`absolute right-2 top-2 text-xl ${
                  emailValid ? "text-turquoise" : "text-lightCoralPink"
                }`}
              >
                ✔
              </span>
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Lösenord"
                required
                className="w-full p-2 border border-softGray rounded focus:outline-none focus:ring-2 focus:ring-turquoise"
              />
              <ul className="mt-2 text-sm">
                <li className={passwordValidation.length ? "text-turquoise" : "text-lightCoralPink"}>
                  Minst 5 tecken
                </li>
                <li className={passwordValidation.uppercase ? "text-turquoise" : "text-lightCoralPink"}>
                  En stor bokstav
                </li>
                <li className={passwordValidation.number ? "text-turquoise" : "text-lightCoralPink"}>
                  En siffra
                </li>
                <li
                  className={passwordValidation.specialChar ? "text-turquoise" : "text-lightCoralPink"}
                >
                  Ett specialtecken
                </li>
              </ul>
            </div>
            <button
              type="submit"
              className={`w-full p-2 rounded ${
                allRequirementsMet()
                  ? "bg-turquoise text-warmWhite hover: transform transition-transform duration-200 hover:scale-105" 
                  : "bg-softGray text-charcoalGray"
              }`}
              disabled={!allRequirementsMet()}
            >
              Registrera
            </button>
          </form>
        ) : isVerifying ? (
          <form onSubmit={handleVerification} className="space-y-4">
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Verifieringskod"
              required
              className="w-full p-2 border border-softGray rounded focus:outline-none focus:ring-2 focus:ring-turquoise"
            />
            <button
              type="submit"
              className="w-full p-2 bg-turquoise text-warmWhite rounded hover:bg-lightLavender"
            >
              Verifiera
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-post"
              required
              className="w-full p-2 border border-softGray rounded focus:outline-none focus:ring-2 focus:ring-turquoise"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Lösenord"
              required
              className="w-full p-2 border border-softGray rounded focus:outline-none focus:ring-2 focus:ring-turquoise"
            />
            <button
              type="submit"
              className="w-full p-2 bg-turquoise text-warmWhite rounded hover:transform transition-transform duration-200 hover:scale-105"
            >
              Logga in
            </button>
          </form>
        )}
  
        <button onClick={toggleAuthMode} className="mt-4 text-lavenderPurple hover:underline">
          {isRegistering
            ? "Har du redan ett konto? Logga in här"
            : "Behöver du ett konto? Registrera dig här"}
        </button>
      </div>
    </div>
  );
  
};

export default AuthModal;

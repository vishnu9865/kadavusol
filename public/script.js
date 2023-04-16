document.getElementById("copyButton").addEventListener('click', (event) => {
  let password = event.target.value;
  navigator.clipboard.writeText(password);
  alert("Password copied to Clipboard!!");
  console.log(password);
});
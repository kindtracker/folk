const folk_url = "http://127.0.0.1:6969";

browser.runtime.onMessage.addListener(async (request) => {
  const res = await fetch(folk_url + request.type);

  if (request.type.endsWith(".png")) {
    const blob = await res.blob();

    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  return res.json();
});

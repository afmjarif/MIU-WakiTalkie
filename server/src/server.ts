const PORT = Number(process.env.PORT ?? 4000);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MIU WakiTalkie API listening on port ${PORT}`);
});

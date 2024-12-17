import React from "react";
import Link from "next/link";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import styles from "../styles/index.module.css";
import Share from "../components/Share";
import useToolsData from "../hooks/useToolsData";

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

const Home = () => {
  const toolsData = useToolsData();
  const { t } = useTranslation();

  return (
    <>
      <Head>
        {/* Anything you add here will be added to this page only */}
        <title>Free Online PDF Tools | Convert, Edit, Compress PDFs Easily</title>
        <meta
          name="description"
          content="Use our free online PDF tool to easily convert, compress, and edit PDF files without any software installation. Convert PDFs to Word, Excel, JPG, and other formats with ease. Our tools are simple, fast, and accessible on any device."
        />
        <meta
          name="Keywords"
          content="PDF tools, online PDF converter, PDF editor, PDF compressor, convert PDF to Word, convert PDF to Excel, compress PDF, edit PDF, free PDF tools, online PDF editor, convert PDF to JPG, PDF to PNG, merge PDF, split PDF, compress PDF online, edit PDF online"
        />
        {/* You can add your canonical here */}
        <link
          rel="canonical"
          href={`https://pdfdok.com/`}
          key="canonical"
        />
        {/* You can add your alternate links here, example: */}
      
       <link
          rel="alternate"
          href={`https://pdfdok.com/en`}
          hrefLang="en"
        />
      
      <link
          rel="alternate"
          href={`https://pdfdok.com/es`}
          hrefLang="es"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ar`}
          hrefLang="ar"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/zh`}
          hrefLang="zh"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/de`}
          hrefLang="de"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/fr`}
          hrefLang="fr"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/it`}
          hrefLang="it"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/pt`}
          hrefLang="pt"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ru`}
          hrefLang="ru"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/uk`}
          hrefLang="uk"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/id`}
          hrefLang="id"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/da`}
          hrefLang="da"
        />

        <link
          rel="alternate"
          href={`https://pdfdok.com/nl`}
          hrefLang="nl"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/hi`}
          hrefLang="hi"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ko`}
          hrefLang="ko"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ja`}
          hrefLang="ja"
        />
      {/* Canonical Tags for Each Language Page */}
    <link
      rel="canonical"
      href={`https://pdfdok.com/en`}
      key="canonical-en"
    />
    <link
      rel="canonical"
      href={`https://pdfdok.com/es`}
      key="canonical-es"
    />
    <link
      rel="canonical"
      href={`https://pdfdok.com/ar`}
      key="canonical-ar"
    />
    <link
      rel="canonical"
      href={`https://pdfdok.com/zh`}
      key="canonical-zh"
    />
    <link
      rel="canonical"
      href={`https://pdfdok.com/de`}
      key="canonical-de"
    />
    <link
      rel="canonical"
      href={`https://pdfdok.com/fr`}
      key="canonical-fr"
    />
    <link
      rel="canonical"
      href={`https://pdfdok.com/it`}
      key="canonical-it"
    />
    <link
      rel="canonical"
      href={`https://pdfdok.com/pt`}
      key="canonical-pt"
    />
    <link
      rel="canonical"
      href={`https://pdfdok.com/ru`}
      key="canonical-ru"
    />
    <link
      rel="canonical"
      href={`https://pdfdok.com/uk`}
      key="canonical-uk"
    />
    <link
      rel="canonical"
      href={`https://pdfdok.com/id`}
      key="canonical-id"
    />
    <link
      rel="canonical"
      href={`https://pdfdok.com/da`}
      key="canonical-da"
    />
    <link
      rel="canonical"
      href={`https://pdfdok.com/nl`}
      key="canonical-nl"
    />
    <link
      rel="canonical"
      href={`https://pdfdok.com/hi`}
      key="canonical-hi"
    />
    <link
      rel="canonical"
      href={`https://pdfdok.com/ko`}
      key="canonical-ko"
    />
    <link
      rel="canonical"
      href={`https://pdfdok.com/ja`}
      key="canonical-ja"
    />
      <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6844476072237024"
     crossorigin="anonymous"></script>

      </Head>



      <>
        <main>


          <header className="page_section  mb-0 home_header">
            <div>
            <h1 className="title">{t("common:page_header_title")}</h1>
            <p className="description">{t("common:page_header_text")}</p>
            <Link href={'#tools'}><button className="header_btn" > Explore All PDF Tools </button></Link>

            </div>


            <img className="header_img" src="/img/homepage.svg" /> 
                                    
          </header>


          <section className="page_section mt-0">
            <article className="container">
              <section
                style={{
                  marginBottom: "10px",
                  marginTop: "10px",
                }}
              >
                <div id="tools" className={styles.grid_container}>
                  {Object.keys(toolsData).map((key) => (
                    <Link
                      key={key}
                      className={styles.grid_item}
                      href={toolsData[key].href}
                      prefetch={false}
                    >
                      <div className={styles.grid_content}>
                        <div className={styles.grid_item_icon}>
                          {toolsData[key].icon}
                        </div>
                        <h2 className={styles.grid_item_title}>
                          {toolsData[key].title}
                        </h2>
                        <p className={styles.grid_item_description}>
                          {toolsData[key].description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </article>
          </section>

          <Share />       
                  
        </main>
      </>
    </>
  );
};
export default Home;

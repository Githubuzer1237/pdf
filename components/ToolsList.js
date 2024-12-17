import React from "react";
import NavItem from "./NavItem";
import { useTranslation } from "next-i18next";
import useToolsData from "../hooks/useToolsData";

const ToolsList = React.memo(function ToolsList() {
  const toolsData = useToolsData();
  const { t } = useTranslation();
  return (
    <div>
      <div className="dropdown_item">
        <h3 className="item_heading">{t("common:tool_group_merge_&_edit")}</h3>

        <NavItem
          title={toolsData["MergePDFTool"].title}
          url={toolsData["MergePDFTool"].href}
          icon={toolsData["MergePDFTool"].icon}
        />

        <NavItem
          title={toolsData["RotatePDFTool"].title}
          url={toolsData["RotatePDFTool"].href}
          icon={toolsData["RotatePDFTool"].icon}
        />

        <NavItem
          title={toolsData["RemovePDFPagesTool"].title}
          url={toolsData["RemovePDFPagesTool"].href}
          icon={toolsData["RemovePDFPagesTool"].icon}
        />

        <NavItem
          title={toolsData["OrganizePDFTool"].title}
          url={toolsData["OrganizePDFTool"].href}
          icon={toolsData["OrganizePDFTool"].icon}
        />
      </div>

      <div className="dropdown_item">
        <h3 className="item_heading">
          {t("common:tool_group_optimize_&_extract")}
        </h3>

        <NavItem
          title={toolsData["CompressPDFTool"].title}
          url={toolsData["CompressPDFTool"].href}
          icon={toolsData["CompressPDFTool"].icon}
        />

        <NavItem
          title={toolsData["GrayscalePDFTool"].title}
          url={toolsData["GrayscalePDFTool"].href}
          icon={toolsData["GrayscalePDFTool"].icon}
        />

        <NavItem
          title={toolsData["ExtractPagesTool"].title}
          url={toolsData["ExtractPagesTool"].href}
          icon={toolsData["ExtractPagesTool"].icon}
        />

        <NavItem
          title={toolsData["RepairPDFTool"].title}
          url={toolsData["RepairPDFTool"].href}
          icon={toolsData["RepairPDFTool"].icon}
        />
      </div>

      <div className="dropdown_item">
        <h3 className="item_heading">
          {t("common:tool_group_convert_to_pdf")}
        </h3>

        <NavItem
          title={toolsData["JPGToPDFTool"].title}
          url={toolsData["JPGToPDFTool"].href}
          icon={toolsData["JPGToPDFTool"].icon}
        />

        <NavItem
          title={toolsData["PNGToPDFTool"].title}
          url={toolsData["PNGToPDFTool"].href}
          icon={toolsData["PNGToPDFTool"].icon}
        />

        <NavItem
          title={toolsData["BMPToPDFTool"].title}
          url={toolsData["BMPToPDFTool"].href}
          icon={toolsData["BMPToPDFTool"].icon}
        />

        <NavItem
          title={toolsData["TIFFToPDFTool"].title}
          url={toolsData["TIFFToPDFTool"].href}
          icon={toolsData["TIFFToPDFTool"].icon}
        />

        <NavItem
          title={toolsData["WORDToPDFTool"].title}
          url={toolsData["WORDToPDFTool"].href}
          icon={toolsData["WORDToPDFTool"].icon}
        />

        <NavItem
          title={toolsData["PPTXToPDFTool"].title}
          url={toolsData["PPTXToPDFTool"].href}
          icon={toolsData["PPTXToPDFTool"].icon}
        />

        <NavItem
          title={toolsData["TXTToPDFTool"].title}
          url={toolsData["TXTToPDFTool"].href}
          icon={toolsData["TXTToPDFTool"].icon}
        />

        <NavItem
          title={toolsData["EXCELToPDFTool"].title}
          url={toolsData["EXCELToPDFTool"].href}
          icon={toolsData["EXCELToPDFTool"].icon}
        />
      </div>

      <div className="dropdown_item">
        <h3 className="item_heading">
          {t("common:tool_group_convert_from_pdf")}
        </h3>

        <NavItem
          title={toolsData["PDFToJPGTool"].title}
          url={toolsData["PDFToJPGTool"].href}
          icon={toolsData["PDFToJPGTool"].icon}
        />

        <NavItem
          title={toolsData["PDFToPNGTool"].title}
          url={toolsData["PDFToPNGTool"].href}
          icon={toolsData["PDFToPNGTool"].icon}
        />

        <NavItem
          title={toolsData["PDFToBMPTool"].title}
          url={toolsData["PDFToBMPTool"].href}
          icon={toolsData["PDFToBMPTool"].icon}
        />

        <NavItem
          title={toolsData["PDFToTIFFTool"].title}
          url={toolsData["PDFToTIFFTool"].href}
          icon={toolsData["PDFToTIFFTool"].icon}
        />

        <NavItem
          title={toolsData["PDFToWORDTool"].title}
          url={toolsData["PDFToWORDTool"].href}
          icon={toolsData["PDFToWORDTool"].icon}
        />

        <NavItem
          title={toolsData["PDFToPPTXTool"].title}
          url={toolsData["PDFToPPTXTool"].href}
          icon={toolsData["PDFToPPTXTool"].icon}
        />

        <NavItem
          title={toolsData["PDFToTXTTool"].title}
          url={toolsData["PDFToTXTTool"].href}
          icon={toolsData["PDFToTXTTool"].icon}
        />

        <NavItem
          title={toolsData["PDFToZIPTool"].title}
          url={toolsData["PDFToZIPTool"].href}
          icon={toolsData["PDFToZIPTool"].icon}
        />
      </div>

      <div className="dropdown_item">
        <h3 className="item_heading">{t("common:tool_group_pdf_security")}</h3>

        <NavItem
          title={toolsData["ProtectPDFTool"].title}
          url={toolsData["ProtectPDFTool"].href}
          icon={toolsData["ProtectPDFTool"].icon}
        />

        <NavItem
          title={toolsData["UnlockPDFTool"].title}
          url={toolsData["UnlockPDFTool"].href}
          icon={toolsData["UnlockPDFTool"].icon}
        />
      </div>
    </div>
  );
});

export default ToolsList;

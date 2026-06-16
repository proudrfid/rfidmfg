#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build-datasheets.py — 为每个产品生成一页式规格书 PDF(datasheets/<slug>.pdf)。
数据来源: products.json(由 build-datasheets.sh 从 build-products.js 抽取)。
依赖: pip install reportlab --break-system-packages
注意: 生成的 PDF 是静态资源,已纳入 git;改产品数据后重跑 build-datasheets.sh 即可。
"""
import json, os
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Table, TableStyle, ListFlowable, ListItem
from reportlab.pdfbase.pdfmetrics import stringWidth

NAVY=colors.HexColor('#0a1b34'); BRAND=colors.HexColor('#0b6fb8'); ACC=colors.HexColor('#0aa2e8'); MUT=colors.HexColor('#5b6b82'); LINE=colors.HexColor('#e4e9f1')
CATN={'cards':'RFID & Smart Cards','labels':'RFID Labels & Inlays','tags':'RFID Tags','blocking':'RFID Blocking','hardware':'RFID Readers & Hardware'}
ss=getSampleStyleSheet()
H1=ParagraphStyle('H1',parent=ss['Title'],fontSize=20,leading=23,textColor=NAVY,spaceAfter=2,alignment=0)
EY=ParagraphStyle('EY',fontSize=9,textColor=ACC,spaceAfter=2,fontName='Helvetica-Bold')
TAG=ParagraphStyle('TAG',fontSize=11,textColor=BRAND,leading=14,spaceAfter=8,fontName='Helvetica-Oblique')
BODY=ParagraphStyle('BODY',fontSize=9.5,leading=14,textColor=colors.HexColor('#15233b'),spaceAfter=6)
H2=ParagraphStyle('H2',fontSize=11,leading=13,textColor=NAVY,fontName='Helvetica-Bold',spaceBefore=8,spaceAfter=4)
CELLK=ParagraphStyle('CK',fontSize=9,leading=11,textColor=NAVY,fontName='Helvetica-Bold')
CELLV=ParagraphStyle('CV',fontSize=9,leading=11,textColor=colors.HexColor('#15233b'))

def deco(c,d):
    c.saveState()
    c.setFillColor(NAVY); c.rect(0, LETTER[1]-20*mm, LETTER[0], 20*mm, fill=1, stroke=0)
    c.setFillColor(ACC); c.rect(0, LETTER[1]-20*mm-2, LETTER[0], 2, fill=1, stroke=0)
    c.setFillColor(colors.white); c.setFont('Helvetica-Bold',15); c.drawString(18*mm, LETTER[1]-13*mm, 'RFID MFG')
    sx = 18*mm + stringWidth('RFID MFG','Helvetica-Bold',15) + 7*mm
    c.setFillColor(colors.HexColor('#a9c6e6')); c.setFont('Helvetica',8); c.drawString(sx, LETTER[1]-13*mm, 'RFID & Smart-Card Manufacturer · Since 1996')
    c.setFont('Helvetica',8); c.setFillColor(colors.white); c.drawRightString(LETTER[0]-18*mm, LETTER[1]-13*mm, 'www.rfidmfg.com')
    # footer (stacked, non-overlapping)
    c.setStrokeColor(LINE); c.setLineWidth(0.6); c.line(18*mm,16*mm,LETTER[0]-18*mm,16*mm)
    c.setFillColor(MUT); c.setFont('Helvetica',7.5)
    c.drawString(18*mm,11.5*mm,'RFID MFG Co., Ltd.   ·   peter@rfidmfg.com   ·   +86 755 2376 5843   ·   Shenzhen, China')
    c.setFont('Helvetica',7)
    c.drawString(18*mm,8*mm,'OEM/ODM · ISO 9001/14001/45001 · CE/FCC/FSC/RoHS/REACH · samples available · 2-year warranty')
    c.drawString(18*mm,5*mm,'Specifications are customizable and subject to change without notice; confirmed on written quotation.')
    c.restoreState()

def build(p):
    fn='datasheets/%s.pdf'%p['slug']
    doc=BaseDocTemplate(fn,pagesize=LETTER,topMargin=26*mm,bottomMargin=22*mm,leftMargin=18*mm,rightMargin=18*mm,
                        title=p['name']+' — Datasheet | RFID MFG',author='RFID MFG')
    doc.addPageTemplates([PageTemplate(id='m',frames=[Frame(18*mm,22*mm,LETTER[0]-36*mm,LETTER[1]-48*mm,id='f')],onPage=deco)])
    fl=[Paragraph(CATN.get(p['cat'],p['cat']).upper(),EY),
        Paragraph(p['name']+' — Datasheet',H1),
        Paragraph(p.get('tagline',''),TAG),
        Paragraph(p.get('overview',''),BODY),
        Paragraph('Specifications',H2)]
    rows=[[Paragraph(k,CELLK),Paragraph(v,CELLV)] for k,v in p.get('specs',[])]
    t=Table(rows,colWidths=[42*mm,LETTER[0]-36*mm-42*mm])
    t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LINEBELOW',(0,0),(-1,-1),0.5,LINE),
                           ('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),('LEFTPADDING',(0,0),(0,-1),0)]))
    fl.append(t)
    fl.append(Paragraph('Applications',H2))
    fl.append(Paragraph(' · '.join(p.get('apps',[])),BODY))
    fl.append(Paragraph('Why RFID MFG',H2))
    items=['Since 1996 — nearly three decades in RFID & smart-card manufacturing',
           '20,000 m² ISO-certified facility with six production lines',
           'First-hand chip sourcing for stable supply and sharp pricing',
           'Full OEM / ODM, custom encoding under NDA',
           'Exports to 100+ countries · samples available · 2-year warranty']
    fl.append(ListFlowable([ListItem(Paragraph(x,BODY),leftIndent=10) for x in items],
                           bulletType='bullet',start='•',bulletColor=ACC,leftIndent=10))
    doc.build(fl)

def main():
    prods=json.load(open('products.json'))
    os.makedirs('datasheets',exist_ok=True)
    for p in prods: build(p)
    sz=round(sum(os.path.getsize('datasheets/'+f) for f in os.listdir('datasheets') if f.endswith('.pdf'))/1024)
    print('Generated %d datasheets in datasheets/ (%d KB).'%(len(prods),sz))

if __name__=='__main__':
    main()

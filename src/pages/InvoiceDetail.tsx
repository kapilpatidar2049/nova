import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Printer, Share2, MapPin, Phone, Mail } from "lucide-react";
import { customerApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const res = await customerApi.getInvoiceById(id);
        if (res.success && res.data) {
          setInvoice(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Generating invoice...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-muted-foreground">Invoice not found or not yet ready.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary font-semibold">Go back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header - Not visible during print */}
      <div className="px-4 pt-12 pb-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-display font-bold text-foreground">Invoice</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 max-w-2xl mx-auto">
        <div 
          ref={invoiceRef}
          id="print-section"
          className="bg-white text-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 print:shadow-none print:border-none print:p-0"
        >
          {/* Invoice Header */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-6 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-1">{invoice.vendor.name}</h2>
              <div className="text-xs text-slate-500 space-y-0.5">
                {invoice.vendor.address && <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {invoice.vendor.address}</p>}
                {invoice.vendor.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {invoice.vendor.phone}</p>}
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider">Invoice</h3>
              <p className="text-xs font-semibold text-primary">{invoice.invoiceNumber}</p>
              <p className="text-[10px] text-slate-500 mt-1">{new Date(invoice.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
            </div>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Billed To</span>
              <p className="text-sm font-bold text-slate-900">{invoice.customer.name}</p>
              <div className="text-xs text-slate-500 space-y-0.5 mt-1">
                {invoice.customer.phone && <p>{invoice.customer.phone}</p>}
                {invoice.customer.email && <p>{invoice.customer.email}</p>}
                {invoice.customer.address && <p className="mt-1 line-clamp-2">{invoice.customer.address}</p>}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Payment Method</span>
              <p className="text-sm font-bold text-slate-900 uppercase">{invoice.paymentMode}</p>
              <div className="mt-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${invoice.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-2 text-slate-500 font-semibold">Description</th>
                  <th className="py-2 text-center text-slate-500 font-semibold w-16">Qty</th>
                  <th className="py-2 text-right text-slate-500 font-semibold w-24">Price</th>
                  <th className="py-2 text-right text-slate-500 font-semibold w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-50">
                    <td className="py-3 pr-4">
                      <p className="font-bold text-slate-800">{item.name}</p>
                    </td>
                    <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                    <td className="py-3 text-right text-slate-600">₹{item.price}</td>
                    <td className="py-3 text-right font-bold text-slate-900">₹{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-48 space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Subtotal</span>
                <span>₹{invoice.subTotal || invoice.total}</span>
              </div>
              {invoice.gstAmount > 0 && (
                <div className="flex justify-between text-xs text-slate-500">
                  <span>GST</span>
                  <span>₹{invoice.gstAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-primary pt-2 border-t border-slate-100 mt-2">
                <span>Total Amount</span>
                <span>₹{invoice.total}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-8 border-t border-slate-100">
            <p className="text-sm font-bold text-slate-800 mb-1">Thank you for your business!</p>
            <p className="text-[10px] text-slate-400 italic">This is a computer generated invoice and does not require a signature.</p>
          </div>
        </div>

        {/* Action Buttons (Mobile) */}
        <div className="mt-6 flex flex-col gap-3 print:hidden">
           <button 
             onClick={handlePrint}
             className="w-full gradient-primary text-primary-foreground py-4 rounded-2xl font-bold shadow-salon flex items-center justify-center gap-2"
           >
             <Download className="w-5 h-5" /> Download / Print PDF
           </button>
           <p className="text-center text-xs text-muted-foreground">
             Need help? Contact us or the salon expert.
           </p>
        </div>
      </div>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-section, #print-section * {
            visibility: visible;
          }
          #print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-container {
            padding: 2cm !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceDetail;
